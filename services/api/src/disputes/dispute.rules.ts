import { DomainError } from '../common/errors/domain-error';
import { BookingStatus, DisputeResolution, EscrowStatus } from '../common/enums';

export interface DisputeCandidate {
  booking: { touristId: string; guideId: string; status: BookingStatus; completedAt: Date | null };
  actor: { id: string; guideId?: string | null };
  escrowStatus: EscrowStatus | null;
  hasOpenDispute: boolean;
  now: Date;
  windowDays: number;
}

export function assertCanOpenDispute(c: DisputeCandidate): void {
  const participant = c.actor.id === c.booking.touristId || (!!c.actor.guideId && c.actor.guideId === c.booking.guideId);
  if (!participant) {
    throw new DomainError('NOT_PARTICIPANT', 'You are not part of this booking', 'forbidden');
  }
  if (![BookingStatus.IN_PROGRESS, BookingStatus.COMPLETED].includes(c.booking.status)) {
    throw new DomainError('DISPUTE_NOT_ALLOWED', 'Disputes can only be opened for tours in progress or completed');
  }
  if (c.booking.status === BookingStatus.COMPLETED && c.booking.completedAt) {
    const deadline = c.booking.completedAt.getTime() + c.windowDays * 24 * 60 * 60 * 1000;
    if (c.now.getTime() > deadline) {
      throw new DomainError('DISPUTE_WINDOW_CLOSED', `Disputes must be opened within ${c.windowDays} days of the tour`);
    }
  }
  if (c.hasOpenDispute) {
    throw new DomainError('DISPUTE_ALREADY_OPEN', 'A dispute is already open for this booking', 'conflict');
  }
  if (c.escrowStatus !== EscrowStatus.HELD) {
    throw new DomainError('ESCROW_NOT_HELD', 'Funds for this booking are no longer held in escrow', 'conflict');
  }
}

/** Refund percentage implied by a dispute resolution. */
export function resolutionRefundPercent(resolution: DisputeResolution, refundPercent?: number | null): number {
  switch (resolution) {
    case DisputeResolution.REFUND_TOURIST:
      return 100;
    case DisputeResolution.RELEASE_TO_GUIDE:
      return 0;
    case DisputeResolution.PARTIAL_REFUND:
      if (!Number.isInteger(refundPercent) || refundPercent! < 1 || refundPercent! > 99) {
        throw new DomainError('INVALID_REFUND_PERCENT', 'Partial refunds need a refundPercent between 1 and 99');
      }
      return refundPercent!;
  }
}
