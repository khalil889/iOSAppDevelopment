import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { ClientPaymentConfig, HoldRequest, HoldResult, PaymentProvider } from './payment-provider.interface';

/** Subset of Moyasar's payment object that we rely on. */
export interface MoyasarPayment {
  id: string;
  status: 'initiated' | 'paid' | 'authorized' | 'captured' | 'failed' | 'refunded' | 'voided' | 'verified';
  amount: number;
  currency: string;
  refunded?: number;
  metadata?: Record<string, string> | null;
  source?: { type?: string; message?: string | null; transaction_url?: string | null } | null;
}

export class MoyasarError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'MoyasarError';
  }
}

/**
 * Moyasar (https://moyasar.com) — mada, Apple Pay, STC Pay and cards in SAR.
 *
 * Flow: the app creates the payment itself with the publishable key via the
 * Moyasar SDK (which also runs 3-D Secure), attaching `booking_id` metadata,
 * and sends us the payment id. We fetch it with the secret key and only accept
 * it when amount, currency and booking all match. A `token_...` from card
 * tokenisation is also accepted, in which case we create the payment here.
 *
 * Funds are captured immediately and held by the platform (escrow is a ledger
 * state, not a card authorisation, since authorisations expire long before
 * most tours). `release` records the guide payout; paying it out is done via
 * Moyasar Payouts or bank transfer outside this API.
 */
export class MoyasarPaymentProvider implements PaymentProvider {
  readonly name = 'moyasar';
  private readonly logger = new Logger(MoyasarPaymentProvider.name);
  private readonly apiUrl: string;
  private readonly secretKey: string;
  private readonly publishableKey: string;
  private readonly callbackUrl: string;

  constructor(
    config: ConfigService,
    private readonly http: typeof fetch = fetch,
  ) {
    this.apiUrl = config.get<string>('moyasar.apiUrl')!.replace(/\/$/, '');
    this.secretKey = config.get<string>('moyasar.secretKey') ?? '';
    this.publishableKey = config.get<string>('moyasar.publishableKey') ?? '';
    this.callbackUrl = config.get<string>('moyasar.callbackUrl') ?? '';
    const missing = [
      ['MOYASAR_SECRET_KEY', this.secretKey],
      ['MOYASAR_PUBLISHABLE_KEY', this.publishableKey],
      ['MOYASAR_CALLBACK_URL', this.callbackUrl],
    ].filter(([, v]) => !v);
    if (missing.length) {
      throw new Error(`PAYMENT_PROVIDER=moyasar requires ${missing.map(([k]) => k).join(', ')}`);
    }
  }

  clientConfig(): ClientPaymentConfig {
    return { provider: this.name, publishableKey: this.publishableKey, callbackUrl: this.callbackUrl };
  }

  async hold(req: HoldRequest): Promise<HoldResult> {
    const ref = req.paymentMethodToken.trim();
    let payment: MoyasarPayment;
    try {
      payment = ref.startsWith('token_')
        ? await this.request<MoyasarPayment>('POST', '/payments', {
            given_id: randomUUID(),
            amount: req.amountMinor,
            currency: req.currency,
            description: `Tour booking ${req.bookingId}`,
            callback_url: this.callbackUrl,
            metadata: { booking_id: req.bookingId },
            source: { type: 'token', token: ref },
          })
        : await this.fetchPayment(ref);
    } catch (e) {
      if (e instanceof MoyasarError && e.status >= 400 && e.status < 500) {
        return { status: 'failed', providerRef: ref, failureReason: e.message };
      }
      throw e;
    }
    return this.toHoldResult(payment, req);
  }

  async verify(providerRef: string, expected: Omit<HoldRequest, 'paymentMethodToken'>): Promise<HoldResult> {
    return this.toHoldResult(await this.fetchPayment(providerRef), expected);
  }

  async release(providerRef: string, amountMinor: number, payee: { guideId: string }) {
    // No money moves at Moyasar here — the captured funds already sit in the
    // merchant balance. Record the payout for finance to settle.
    this.logger.log(`Payout owed: ${amountMinor} to guide ${payee.guideId} for payment ${providerRef}`);
    return { payoutRef: `ledger_${randomUUID()}` };
  }

  async refund(providerRef: string, amountMinor: number, reason: string) {
    this.logger.log(`Refunding ${amountMinor} on ${providerRef}: ${reason}`);
    const p = await this.request<MoyasarPayment>('POST', `/payments/${encodeURIComponent(providerRef)}/refund`, {
      amount: amountMinor,
    });
    return { refundRef: p.id };
  }

  fetchPayment(id: string) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new MoyasarError(400, 'Invalid Moyasar payment id');
    return this.request<MoyasarPayment>('GET', `/payments/${id}`);
  }

  private async toHoldResult(
    p: MoyasarPayment,
    expected: Pick<HoldRequest, 'bookingId' | 'amountMinor' | 'currency'>,
  ): Promise<HoldResult> {
    const fail = (failureReason: string): HoldResult => ({ status: 'failed', providerRef: p.id, failureReason });

    // A client-created payment must be for exactly this booking and amount.
    if (p.metadata?.booking_id && p.metadata.booking_id !== expected.bookingId) {
      return fail('Payment belongs to a different booking');
    }
    if (p.amount !== expected.amountMinor || p.currency.toUpperCase() !== expected.currency.toUpperCase()) {
      return fail(`Payment amount ${p.amount} ${p.currency} does not match ${expected.amountMinor} ${expected.currency}`);
    }

    switch (p.status) {
      case 'paid':
      case 'captured':
        if (!p.metadata?.booking_id) return fail('Payment is missing booking_id metadata');
        return { status: 'held', providerRef: p.id };
      case 'authorized': {
        // Created with manual capture: capture now so funds are secured.
        if (!p.metadata?.booking_id) return fail('Payment is missing booking_id metadata');
        const captured = await this.request<MoyasarPayment>('POST', `/payments/${p.id}/capture`, { amount: p.amount });
        return captured.status === 'captured' || captured.status === 'paid'
          ? { status: 'held', providerRef: p.id }
          : fail(`Capture returned ${captured.status}`);
      }
      case 'initiated':
        return {
          status: 'requires_action',
          providerRef: p.id,
          nextActionUrl: p.source?.transaction_url ?? undefined,
        };
      default:
        return fail(p.source?.message || `Payment ${p.status}`);
    }
  }

  private async request<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
    const res = await this.http(`${this.apiUrl}${path}`, {
      method,
      headers: {
        authorization: `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
        accept: 'application/json',
        ...(body ? { 'content-type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(20_000),
    });
    const text = await res.text();
    const json = text ? JSON.parse(text) : {};
    if (!res.ok) {
      const detail = json.errors ? ` (${JSON.stringify(json.errors)})` : '';
      throw new MoyasarError(res.status, `${json.message ?? `Moyasar HTTP ${res.status}`}${detail}`);
    }
    return json as T;
  }
}
