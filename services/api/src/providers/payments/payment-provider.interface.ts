/**
 * Escrow-capable payment gateway. The platform charges the tourist up front
 * and holds the funds until the tour is completed (then releases a payout to
 * the guide) or cancelled/disputed (then refunds all or part).
 *
 * Implement this for a real gateway (Stripe Connect, Moyasar, HyperPay, ...)
 * and bind it to PAYMENT_PROVIDER in ProvidersModule.
 */
export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');

export interface HoldRequest {
  bookingId: string;
  amountMinor: number;
  currency: string;
  /**
   * What the client-side SDK produced. Depending on the gateway this is a
   * card/wallet token, or the id of a payment the app already created with a
   * publishable key (Moyasar) — the provider verifies it server-side.
   */
  paymentMethodToken: string;
  customerId: string;
}

/** Public, non-secret settings the mobile app needs to start a payment. */
export interface ClientPaymentConfig {
  provider: string;
  publishableKey?: string;
  callbackUrl?: string;
}

export interface HoldResult {
  status: 'held' | 'requires_action' | 'failed';
  providerRef: string;
  /** e.g. 3-D Secure redirect for requires_action */
  nextActionUrl?: string;
  failureReason?: string;
}

export interface PaymentProvider {
  readonly name: string;
  /** Charge the tourist and hold funds in escrow. */
  hold(req: HoldRequest): Promise<HoldResult>;
  /**
   * Re-check a hold that needed customer action (e.g. 3-D Secure) using the
   * provider reference returned by `hold`.
   */
  verify(providerRef: string, expected: Omit<HoldRequest, 'paymentMethodToken'>): Promise<HoldResult>;
  clientConfig(): ClientPaymentConfig;
  /** Pay out `amountMinor` of held funds to the guide. */
  release(providerRef: string, amountMinor: number, payee: { guideId: string }): Promise<{ payoutRef: string }>;
  /** Current state of a gateway payment, for reconciling orphaned charges. */
  lookup?(providerRef: string): Promise<{ status: 'captured' | 'pending' | 'failed'; refundableMinor: number } | null>;
  /** Return `amountMinor` of held funds to the tourist. */
  refund(providerRef: string, amountMinor: number, reason: string): Promise<{ refundRef: string }>;
}
