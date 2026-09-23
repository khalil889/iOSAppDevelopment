import { BookingStatus, EscrowStatus } from '../common/enums';

/**
 * Escrow is released to the guide only once the tour is COMPLETED, the
 * dispute window has passed, and no dispute is open.
 */
export function canReleaseEscrow(
  payment: { escrowStatus: EscrowStatus; releaseAfter: Date | null },
  booking: { status: BookingStatus },
  hasOpenDispute: boolean,
  now: Date,
): boolean {
  return (
    payment.escrowStatus === EscrowStatus.HELD &&
    booking.status === BookingStatus.COMPLETED &&
    !hasOpenDispute &&
    !!payment.releaseAfter &&
    payment.releaseAfter <= now
  );
}

export function escrowStatusAfterRefund(amountMinor: number, refundedMinor: number): EscrowStatus {
  if (refundedMinor <= 0) return EscrowStatus.RELEASED;
  if (refundedMinor >= amountMinor) return EscrowStatus.REFUNDED;
  return EscrowStatus.PARTIALLY_REFUNDED;
}
