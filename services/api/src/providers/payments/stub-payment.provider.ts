import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ClientPaymentConfig, HoldRequest, HoldResult, PaymentProvider } from './payment-provider.interface';

/**
 * Always succeeds, except for the magic token `tok_fail` (declined) and
 * `tok_3ds` (requires action). No money moves.
 */
@Injectable()
export class StubPaymentProvider implements PaymentProvider {
  readonly name = 'stub';
  private readonly logger = new Logger(StubPaymentProvider.name);

  async hold(req: HoldRequest): Promise<HoldResult> {
    const providerRef = `stub_pi_${randomUUID()}`;
    if (req.paymentMethodToken === 'tok_fail') {
      return { status: 'failed', providerRef, failureReason: 'Card declined (stub)' };
    }
    if (req.paymentMethodToken === 'tok_3ds') {
      return { status: 'requires_action', providerRef, nextActionUrl: 'https://example.test/3ds' };
    }
    this.logger.log(`HOLD ${req.amountMinor} ${req.currency} for booking ${req.bookingId}`);
    return { status: 'held', providerRef };
  }

  async verify(providerRef: string): Promise<HoldResult> {
    // The stub treats any pending (3-D Secure) payment as completed on re-check.
    return { status: 'held', providerRef };
  }

  clientConfig(): ClientPaymentConfig {
    return { provider: this.name };
  }

  async release(providerRef: string, amountMinor: number, payee: { guideId: string }) {
    this.logger.log(`RELEASE ${amountMinor} from ${providerRef} to guide ${payee.guideId}`);
    return { payoutRef: `stub_po_${randomUUID()}` };
  }

  async refund(providerRef: string, amountMinor: number, reason: string) {
    this.logger.log(`REFUND ${amountMinor} from ${providerRef}: ${reason}`);
    return { refundRef: `stub_re_${randomUUID()}` };
  }
}
