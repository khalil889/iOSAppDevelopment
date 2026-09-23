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
  /** Opaque token from the client-side SDK (card, Apple Pay, mada, ...) */
  paymentMethodToken: string;
  customerId: string;
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
  /** Pay out `amountMinor` of held funds to the guide. */
  release(providerRef: string, amountMinor: number, payee: { guideId: string }): Promise<{ payoutRef: string }>;
  /** Return `amountMinor` of held funds to the tourist. */
  refund(providerRef: string, amountMinor: number, reason: string): Promise<{ refundRef: string }>;
}
