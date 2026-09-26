import { fakeConfig } from '../test-helpers';
import { FcmPushSender, parseServiceAccount } from './fcm-push.sender';

const account = { project_id: 'tg-prod', client_email: 'push@tg-prod.iam.gserviceaccount.com', private_key: '-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----\\n' };

describe('parseServiceAccount', () => {
  it('accepts raw JSON and base64, and restores newlines in the key', () => {
    const fromJson = parseServiceAccount(JSON.stringify(account));
    const fromB64 = parseServiceAccount(Buffer.from(JSON.stringify(account)).toString('base64'));
    expect(fromJson).toEqual(fromB64);
    expect(fromJson.projectId).toBe('tg-prod');
    expect(fromJson.privateKey).toContain('\nabc\n');
  });

  it('rejects incomplete credentials', () => {
    expect(() => parseServiceAccount(JSON.stringify({ project_id: 'x' }))).toThrow(/service-account JSON/);
  });
});

describe('FcmPushSender', () => {
  it('refuses to start without a service account', () => {
    expect(() => new FcmPushSender(fakeConfig({ firebase: { serviceAccount: '' } }))).toThrow(/FIREBASE_SERVICE_ACCOUNT/);
  });

  it('sends notification + data and reports dead tokens', async () => {
    const sendEachForMulticast = jest.fn(async (msg: { tokens: string[] }) => ({
      successCount: 1,
      failureCount: 2,
      responses: msg.tokens.map((t) =>
        t === 'ok'
          ? { success: true }
          : { success: false, error: { code: t === 'dead' ? 'messaging/registration-token-not-registered' : 'messaging/internal-error', message: 'x' } },
      ),
    }));
    const sender = new FcmPushSender(fakeConfig({}), { sendEachForMulticast } as never);
    const res = await sender.send(['ok', 'dead', 'flaky'], { title: 'Booking confirmed', body: 'See you soon', data: { bookingId: 'b1' } });

    expect(res).toEqual({ sent: 1, invalidTokens: ['dead'] }); // transient errors keep the token
    const msg = (sendEachForMulticast.mock.calls[0] as unknown[])[0] as Record<string, any>;
    expect(msg.notification).toEqual({ title: 'Booking confirmed', body: 'See you soon' });
    expect(msg.data).toEqual({ bookingId: 'b1' });
    expect(msg.android.priority).toBe('high');
  });

  it('batches beyond 500 tokens', async () => {
    const sendEachForMulticast = jest.fn(async (msg: { tokens: string[] }) => ({
      successCount: msg.tokens.length,
      failureCount: 0,
      responses: msg.tokens.map(() => ({ success: true })),
    }));
    const sender = new FcmPushSender(fakeConfig({}), { sendEachForMulticast } as never);
    const res = await sender.send(Array.from({ length: 1200 }, (_, i) => `t${i}`), { title: 't', body: 'b' });
    expect(sendEachForMulticast).toHaveBeenCalledTimes(3);
    expect(res.sent).toBe(1200);
  });
});
