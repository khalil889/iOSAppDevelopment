import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import { SumsubIdentityProvider } from './sumsub-identity.provider';

const config = (over: Record<string, string> = {}) =>
  new ConfigService({
    sumsub: {
      apiUrl: 'https://api.sumsub.com',
      appToken: 'sbx:token',
      secretKey: 'app-secret',
      webhookSecret: 'hook-secret',
      levelName: 'id-and-liveness',
      ...over,
    },
  });

describe('SumsubIdentityProvider', () => {
  it('requires credentials', () => {
    expect(() => new SumsubIdentityProvider(config({ appToken: '' }))).toThrow(/SUMSUB_APP_TOKEN/);
  });

  it('signs the WebSDK link request as Sumsub documents', async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const http = (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(JSON.stringify({ url: 'https://in.sumsub.com/websdk/p/abc' }), { status: 200 });
    }) as unknown as typeof fetch;
    const provider = new SumsubIdentityProvider(config(), http, () => 1_790_000_000_000);

    const res = await provider.start({ externalUserId: 'guide-1', email: 'g@x.test', phone: null, lang: 'ar' });
    expect(res.url).toBe('https://in.sumsub.com/websdk/p/abc');

    const { url, init } = calls[0];
    const path = '/resources/sdkIntegrations/levels/-/websdkLink?lang=ar';
    expect(url).toBe(`https://api.sumsub.com${path}`);
    const body = init.body as string;
    expect(JSON.parse(body)).toEqual({
      levelName: 'id-and-liveness',
      userId: 'guide-1',
      ttlInSecs: 1800,
      applicantIdentifiers: { email: 'g@x.test' },
    });
    const headers = init.headers as Record<string, string>;
    expect(headers['X-App-Token']).toBe('sbx:token');
    expect(headers['X-App-Access-Ts']).toBe('1790000000');
    expect(headers['X-App-Access-Sig']).toBe(
      createHmac('sha256', 'app-secret').update(`1790000000POST${path}${body}`).digest('hex'),
    );
  });

  it('surfaces API errors without leaking the response to callers', async () => {
    const http = (async () => new Response('{"description":"Invalid level"}', { status: 400 })) as unknown as typeof fetch;
    await expect(new SumsubIdentityProvider(config(), http).start({ externalUserId: 'g', lang: 'en' })).rejects.toThrow(
      'Sumsub request failed (400)',
    );
  });

  describe('webhooks', () => {
    const provider = new SumsubIdentityProvider(config());
    const raw = Buffer.from(
      JSON.stringify({
        type: 'applicantReviewed',
        applicantId: 'app-1',
        externalUserId: 'guide-1',
        reviewResult: { reviewAnswer: 'RED', reviewRejectType: 'RETRY', rejectLabels: ['SELFIE_MISMATCH'], moderationComment: 'Retake the selfie' },
        reviewStatus: 'completed',
      }),
    );
    const sign = (alg: string, body = raw) => createHmac(alg, 'hook-secret').update(body).digest('hex');

    it('accepts valid digests for each algorithm and rejects others', () => {
      expect(provider.verifyWebhook(raw, { 'x-payload-digest': sign('sha256') })).toBe(true);
      expect(provider.verifyWebhook(raw, { 'x-payload-digest': sign('sha512'), 'x-payload-digest-alg': 'HMAC_SHA512_HEX' })).toBe(true);
      expect(provider.verifyWebhook(raw, { 'x-payload-digest': sign('sha1'), 'x-payload-digest-alg': 'HMAC_SHA1_HEX' })).toBe(true);
      expect(provider.verifyWebhook(raw, { 'x-payload-digest': sign('sha256'), 'x-payload-digest-alg': 'MD5' })).toBe(false);
      expect(provider.verifyWebhook(Buffer.from(raw.toString() + ' '), { 'x-payload-digest': sign('sha256') })).toBe(false);
      expect(provider.verifyWebhook(raw, {})).toBe(false);
    });

    it('maps review results to outcomes', () => {
      expect(provider.parseWebhook(raw)).toEqual({
        type: 'applicantReviewed',
        externalUserId: 'guide-1',
        applicantId: 'app-1',
        outcome: { status: 'retry', labels: ['SELFIE_MISMATCH'], comment: 'Retake the selfie' },
        occurredAt: null,
      });
      const timed = (o: object) => provider.parseWebhook(Buffer.from(JSON.stringify({ type: 'applicantPending', externalUserId: 'g', ...o })))?.occurredAt;
      expect(timed({ createdAtMs: '1790000000000' })?.getTime()).toBe(1_790_000_000_000);
      expect(timed({ createdAt: '2026-09-26 10:00:00+0000' })?.toISOString()).toBe('2026-09-26T10:00:00.000Z');
      const parse = (o: object) => provider.parseWebhook(Buffer.from(JSON.stringify({ externalUserId: 'g', ...o })))?.outcome;
      expect(parse({ type: 'applicantReviewed', reviewResult: { reviewAnswer: 'GREEN' } })).toEqual({ status: 'approved' });
      expect(parse({ type: 'applicantReviewed', reviewResult: { reviewAnswer: 'RED', reviewRejectType: 'FINAL' } })?.status).toBe('rejected');
      expect(parse({ type: 'applicantPending' })).toEqual({ status: 'pending' });
      expect(parse({ type: 'applicantCreated' })).toBeNull();
      expect(provider.parseWebhook(Buffer.from('not json'))).toBeNull();
    });
  });
});
