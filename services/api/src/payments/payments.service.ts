import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource, EntityManager, In, LessThanOrEqual } from 'typeorm';
import { Booking } from '../bookings/booking.entity';
import { refundAmount } from '../bookings/booking.rules';
import { DisputeStatus, EscrowStatus } from '../common/enums';
import { DomainError } from '../common/errors/domain-error';
import { Dispute } from '../disputes/dispute.entity';
import { PAYMENT_PROVIDER, PaymentProvider } from '../providers/payments/payment-provider.interface';
import { canReleaseEscrow, escrowStatusAfterRefund } from './escrow.rules';
import { Payment } from './payment.entity';

export type HoldOutcome =
  | { status: 'held'; payment: Payment }
  | { status: 'requires_action'; payment: Payment; nextActionUrl?: string };

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly db: DataSource,
    private readonly config: ConfigService,
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
  ) {}

  /** Charge the tourist and hold the booking total in escrow. */
  async hold(booking: Booking, paymentMethodToken: string): Promise<HoldOutcome> {
    const repo = this.db.getRepository(Payment);
    let payment = await repo.findOneBy({ bookingId: booking.id });
    if (payment && payment.escrowStatus !== EscrowStatus.PENDING && payment.escrowStatus !== EscrowStatus.FAILED) {
      throw new DomainError('ALREADY_PAID', 'This booking has already been paid', 'conflict');
    }
    payment ??= repo.create({ bookingId: booking.id, provider: this.provider.name });

    const res = await this.provider.hold({
      bookingId: booking.id,
      amountMinor: booking.totalMinor,
      currency: booking.currency,
      paymentMethodToken,
      customerId: booking.touristId,
    });

    Object.assign(payment, {
      provider: this.provider.name,
      providerRef: res.providerRef,
      amountMinor: booking.totalMinor,
      currency: booking.currency,
      failureReason: res.failureReason ?? null,
    });

    if (res.status === 'failed') {
      payment.escrowStatus = EscrowStatus.FAILED;
      await repo.save(payment);
      throw new DomainError('PAYMENT_FAILED', res.failureReason ?? 'Payment failed');
    }
    if (res.status === 'requires_action') {
      payment.escrowStatus = EscrowStatus.PENDING;
      return { status: 'requires_action', payment: await repo.save(payment), nextActionUrl: res.nextActionUrl };
    }
    payment.escrowStatus = EscrowStatus.HELD;
    payment.heldAt = new Date();
    return { status: 'held', payment: await repo.save(payment) };
  }

  /** Called when a tour completes: escrow becomes releasable after the dispute window. */
  async scheduleRelease(bookingId: string, completedAt: Date, em: EntityManager = this.db.manager) {
    const days = this.config.get<number>('marketplace.disputeWindowDays')!;
    await em.getRepository(Payment).update(
      { bookingId },
      { releaseAfter: new Date(completedAt.getTime() + days * 86_400_000) },
    );
  }

  async freeze(bookingId: string, em: EntityManager = this.db.manager) {
    await em.getRepository(Payment).update({ bookingId, escrowStatus: EscrowStatus.HELD }, { escrowStatus: EscrowStatus.DISPUTED });
  }

  /**
   * Final settlement of held funds: refund `refundPercent` of the total to the
   * tourist and release the remainder (minus the proportional platform fee) to
   * the guide.
   */
  async settle(booking: Booking, refundPercent: number, reason: string): Promise<Payment | null> {
    const repo = this.db.getRepository(Payment);
    const payment = await repo.findOneBy({ bookingId: booking.id });
    if (!payment) return null;
    if (payment.escrowStatus === EscrowStatus.PENDING || payment.escrowStatus === EscrowStatus.FAILED) {
      // Nothing was captured.
      return payment;
    }
    if (payment.escrowStatus !== EscrowStatus.HELD && payment.escrowStatus !== EscrowStatus.DISPUTED) {
      throw new DomainError('ALREADY_SETTLED', `Payment already ${payment.escrowStatus}`, 'conflict');
    }

    const refund = refundAmount(payment.amountMinor, refundPercent);
    const remaining = payment.amountMinor - refund;
    const payout = payment.amountMinor ? Math.round((booking.guidePayoutMinor * remaining) / payment.amountMinor) : 0;

    if (refund > 0) await this.provider.refund(payment.providerRef!, refund, reason);
    if (payout > 0) await this.provider.release(payment.providerRef!, payout, { guideId: booking.guideId });

    const now = new Date();
    Object.assign(payment, {
      refundedMinor: refund,
      releasedMinor: payout,
      escrowStatus: escrowStatusAfterRefund(payment.amountMinor, refund),
      refundedAt: refund > 0 ? now : null,
      releasedAt: payout > 0 ? now : null,
    });
    return repo.save(payment);
  }

  /** Releases escrow for completed tours whose dispute window has passed. */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async releaseDue(now = new Date()): Promise<number> {
    const due = await this.db.getRepository(Payment).find({
      where: { escrowStatus: EscrowStatus.HELD, releaseAfter: LessThanOrEqual(now) },
      relations: { booking: true },
      take: 200,
    });
    if (!due.length) return 0;
    const open = await this.db.getRepository(Dispute).find({
      where: { bookingId: In(due.map((p) => p.bookingId)), status: DisputeStatus.OPEN },
      select: { bookingId: true },
    });
    const disputed = new Set(open.map((d) => d.bookingId));
    let released = 0;
    for (const p of due) {
      if (!canReleaseEscrow(p, p.booking, disputed.has(p.bookingId), now)) continue;
      try {
        await this.settle(p.booking, 0, 'Tour completed');
        released++;
      } catch (e) {
        this.logger.error(`Release failed for booking ${p.bookingId}: ${(e as Error).message}`);
      }
    }
    if (released) this.logger.log(`Released escrow for ${released} booking(s)`);
    return released;
  }
}
