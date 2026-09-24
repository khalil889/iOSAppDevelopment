import { Body, Controller, ForbiddenException, Get, HttpCode, Logger, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { timingSafeEqual } from 'crypto';
import { Public } from '../common/decorators/public.decorator';
import { PaymentsService } from '../payments/payments.service';
import { BookingsService } from './bookings.service';

interface MoyasarWebhook {
  id?: string;
  type?: string;
  secret_token?: string;
  live?: boolean;
  data?: { id?: string; status?: string; source?: { message?: string } };
}

export function secretMatches(expected: string, given: unknown): boolean {
  if (!expected || typeof given !== 'string') return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}

@ApiTags('payments')
@Controller('payments')
export class PaymentWebhooksController {
  private readonly logger = new Logger(PaymentWebhooksController.name);

  constructor(
    private readonly config: ConfigService,
    private readonly payments: PaymentsService,
    private readonly bookings: BookingsService,
  ) {}

  /** Non-secret settings the app needs to start a payment (provider, publishable key). */
  @Public()
  @Get('config')
  clientConfig() {
    return this.payments.clientConfig();
  }

  /**
   * Moyasar webhook (configure it in the Moyasar dashboard with the same
   * secret as MOYASAR_WEBHOOK_SECRET). Confirms bookings whose app never
   * came back from 3-D Secure. Idempotent: status is re-fetched from Moyasar.
   */
  @Public()
  @SkipThrottle()
  @HttpCode(200)
  @Post('webhooks/moyasar')
  async moyasar(@Body() event: MoyasarWebhook) {
    if (!secretMatches(this.config.get<string>('moyasar.webhookSecret') ?? '', event?.secret_token)) {
      throw new ForbiddenException('Invalid webhook secret');
    }
    const ref = event.data?.id;
    if (!ref) return { received: true };

    const payment = await this.payments.findByProviderRef(ref);
    if (!payment) {
      this.logger.warn(`Webhook ${event.type} for unknown payment ${ref}`);
      return { received: true };
    }

    switch (event.type) {
      case 'payment_paid':
      case 'payment_captured':
        try {
          await this.bookings.confirmPayment(null, payment.bookingId);
        } catch (e) {
          // e.g. slot taken → already refunded; acknowledge so Moyasar stops retrying.
          this.logger.warn(`Webhook confirm for booking ${payment.bookingId}: ${(e as Error).message}`);
        }
        break;
      case 'payment_failed':
      case 'payment_faild': // spelling used in Moyasar's own docs
        await this.payments.markFailed(payment.id, event.data?.source?.message ?? 'Payment failed');
        break;
      default:
        this.logger.log(`Ignoring webhook ${event.type} for ${ref}`);
    }
    return { received: true };
  }
}
