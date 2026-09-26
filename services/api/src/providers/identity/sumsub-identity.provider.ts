import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import {
  IdentityOutcome,
  IdentityProvider,
  IdentityStart,
  IdentityStartRequest,
  IdentityWebhookEvent,
} from './identity-provider.interface';

const DIGEST_ALGS: Record<string, string> = {
  HMAC_SHA256_HEX: 'sha256',
  HMAC_SHA512_HEX: 'sha512',
  HMAC_SHA1_HEX: 'sha1',
};

/**
 * Sumsub (sumsub.com) identity verification.
 * - Requests are signed: X-App-Token, X-App-Access-Ts (unix seconds) and
 *   X-App-Access-Sig = hex HMAC-SHA256(secret, ts + METHOD + path?query + body).
 * - The guide verifies in the hosted WebSDK via a one-off link
 *   (POST /resources/sdkIntegrations/levels/-/websdkLink); our guide id is
 *   the Sumsub `userId`/`externalUserId`.
 * - Results arrive as webhooks signed with x-payload-digest (HMAC of the raw
 *   body with the webhook secret, algorithm in X-Payload-Digest-Alg).
 */
export class SumsubIdentityProvider implements IdentityProvider {
  readonly name = 'sumsub';
  private readonly logger = new Logger(SumsubIdentityProvider.name);
  private readonly apiUrl: string;
  private readonly appToken: string;
  private readonly secretKey: string;
  private readonly webhookSecret: string;
  private readonly levelName: string;

  constructor(
    config: ConfigService,
    private readonly http: typeof fetch = fetch,
    private readonly now: () => number = Date.now,
  ) {
    this.apiUrl = config.get<string>('sumsub.apiUrl')!;
    this.appToken = config.get<string>('sumsub.appToken') ?? '';
    this.secretKey = config.get<string>('sumsub.secretKey') ?? '';
    this.webhookSecret = config.get<string>('sumsub.webhookSecret') ?? '';
    this.levelName = config.get<string>('sumsub.levelName') ?? 'id-and-liveness';
    const missing = [
      ['SUMSUB_APP_TOKEN', this.appToken],
      ['SUMSUB_SECRET_KEY', this.secretKey],
      ['SUMSUB_WEBHOOK_SECRET', this.webhookSecret],
    ].filter(([, v]) => !v);
    if (missing.length) throw new Error(`IDENTITY_PROVIDER=sumsub requires ${missing.map(([k]) => k).join(', ')}`);
  }

  async start(req: IdentityStartRequest): Promise<IdentityStart> {
    const identifiers = Object.fromEntries(
      Object.entries({ email: req.email, phone: req.phone }).filter(([, v]) => !!v),
    );
    const res = await this.request<{ url: string }>('POST', `/resources/sdkIntegrations/levels/-/websdkLink?lang=${req.lang}`, {
      levelName: this.levelName,
      userId: req.externalUserId,
      ttlInSecs: 1800,
      ...(Object.keys(identifiers).length ? { applicantIdentifiers: identifiers } : {}),
    });
    if (!res.url?.startsWith('https://')) throw new Error('Sumsub returned no verification link');
    return { url: res.url };
  }

  verifyWebhook(rawBody: Buffer, headers: Record<string, string | string[] | undefined>): boolean {
    const digest = header(headers, 'x-payload-digest');
    const alg = DIGEST_ALGS[header(headers, 'x-payload-digest-alg') ?? 'HMAC_SHA256_HEX'];
    if (!digest || !alg || !rawBody?.length) return false;
    const expected = createHmac(alg, this.webhookSecret).update(rawBody).digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(digest.toLowerCase());
    return a.length === b.length && timingSafeEqual(a, b);
  }

  parseWebhook(rawBody: Buffer): IdentityWebhookEvent | null {
    let body: {
      type?: string;
      externalUserId?: string;
      applicantId?: string;
      reviewResult?: { reviewAnswer?: string; reviewRejectType?: string; rejectLabels?: string[]; moderationComment?: string };
    };
    try {
      body = JSON.parse(rawBody.toString('utf8'));
    } catch {
      return null;
    }
    if (!body.type || !body.externalUserId) return null;
    return {
      type: body.type,
      externalUserId: body.externalUserId,
      applicantId: body.applicantId ?? null,
      outcome: outcomeFor(body.type, body.reviewResult),
    };
  }

  private async request<T>(method: 'GET' | 'POST', pathWithQuery: string, body?: unknown): Promise<T> {
    const payload = body === undefined ? '' : JSON.stringify(body);
    const ts = Math.floor(this.now() / 1000).toString();
    const sig = createHmac('sha256', this.secretKey).update(ts + method + pathWithQuery + payload).digest('hex');
    let res: Response;
    try {
      res = await this.http(`${this.apiUrl}${pathWithQuery}`, {
        method,
        headers: {
          'X-App-Token': this.appToken,
          'X-App-Access-Ts': ts,
          'X-App-Access-Sig': sig,
          ...(payload ? { 'Content-Type': 'application/json' } : {}),
          Accept: 'application/json',
        },
        body: payload || undefined,
        signal: AbortSignal.timeout(15_000),
      });
    } catch (e) {
      throw new Error(`Sumsub unreachable: ${(e as Error).message}`);
    }
    const text = await res.text();
    if (!res.ok) {
      this.logger.error(`Sumsub ${method} ${pathWithQuery.split('?')[0]} -> ${res.status}: ${text.slice(0, 300)}`);
      throw new Error(`Sumsub request failed (${res.status})`);
    }
    return JSON.parse(text) as T;
  }
}

function header(headers: Record<string, string | string[] | undefined>, name: string): string | undefined {
  const v = headers[name] ?? headers[name.toLowerCase()];
  return Array.isArray(v) ? v[0] : v;
}

function outcomeFor(
  type: string,
  review?: { reviewAnswer?: string; reviewRejectType?: string; rejectLabels?: string[]; moderationComment?: string },
): IdentityOutcome | null {
  switch (type) {
    case 'applicantPending':
    case 'applicantOnHold':
      return { status: 'pending' };
    case 'applicantReset':
      return { status: 'reset' };
    case 'applicantReviewed': {
      if (review?.reviewAnswer === 'GREEN') return { status: 'approved' };
      if (review?.reviewAnswer !== 'RED') return null;
      return {
        status: review.reviewRejectType === 'RETRY' ? 'retry' : 'rejected',
        labels: review.rejectLabels ?? [],
        comment: review.moderationComment ?? null,
      };
    }
    default:
      return null;
  }
}
