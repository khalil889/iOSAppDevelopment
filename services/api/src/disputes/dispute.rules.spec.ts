import { BookingStatus, DisputeResolution, EscrowStatus } from '../common/enums';
import { DomainError } from '../common/errors/domain-error';
import { canReleaseEscrow, escrowStatusAfterRefund } from '../payments/escrow.rules';
import { assertCanOpenDispute, DisputeCandidate, resolutionRefundPercent } from './dispute.rules';

const COMPLETED_AT = new Date('2026-05-01T12:00:00Z');
const days = (d: number) => new Date(COMPLETED_AT.getTime() + d * 86_400_000);

const candidate = (o: Partial<DisputeCandidate> = {}): DisputeCandidate => ({
  booking: { touristId: 't1', guideId: 'g1', status: BookingStatus.COMPLETED, completedAt: COMPLETED_AT },
  actor: { id: 't1' },
  escrowStatus: EscrowStatus.HELD,
  hasOpenDispute: false,
  now: days(2),
  windowDays: 7,
  ...o,
});

const code = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    return (e as DomainError).code;
  }
  return null;
};

describe('assertCanOpenDispute', () => {
  it('allows tourist or guide within the window', () => {
    expect(code(() => assertCanOpenDispute(candidate()))).toBeNull();
    expect(code(() => assertCanOpenDispute(candidate({ actor: { id: 'gu', guideId: 'g1' } })))).toBeNull();
  });

  it('rejects outsiders, wrong states, late disputes, duplicates and released funds', () => {
    expect(code(() => assertCanOpenDispute(candidate({ actor: { id: 'x' } })))).toBe('NOT_PARTICIPANT');
    expect(
      code(() => assertCanOpenDispute(candidate({ booking: { ...candidate().booking, status: BookingStatus.CONFIRMED } }))),
    ).toBe('DISPUTE_NOT_ALLOWED');
    expect(code(() => assertCanOpenDispute(candidate({ now: days(8) })))).toBe('DISPUTE_WINDOW_CLOSED');
    expect(code(() => assertCanOpenDispute(candidate({ hasOpenDispute: true })))).toBe('DISPUTE_ALREADY_OPEN');
    expect(code(() => assertCanOpenDispute(candidate({ escrowStatus: EscrowStatus.RELEASED })))).toBe('ESCROW_NOT_HELD');
  });
});

describe('resolutionRefundPercent', () => {
  it('maps resolutions to refund percentages', () => {
    expect(resolutionRefundPercent(DisputeResolution.REFUND_TOURIST)).toBe(100);
    expect(resolutionRefundPercent(DisputeResolution.RELEASE_TO_GUIDE)).toBe(0);
    expect(resolutionRefundPercent(DisputeResolution.PARTIAL_REFUND, 30)).toBe(30);
    expect(code(() => resolutionRefundPercent(DisputeResolution.PARTIAL_REFUND, 100))).toBe('INVALID_REFUND_PERCENT');
  });
});

describe('escrow release', () => {
  const held = { escrowStatus: EscrowStatus.HELD, releaseAfter: days(7) };
  const completed = { status: BookingStatus.COMPLETED };

  it('releases only after the dispute window with no open dispute', () => {
    expect(canReleaseEscrow(held, completed, false, days(7))).toBe(true);
    expect(canReleaseEscrow(held, completed, false, days(6))).toBe(false);
    expect(canReleaseEscrow(held, completed, true, days(8))).toBe(false);
    expect(canReleaseEscrow(held, { status: BookingStatus.IN_PROGRESS }, false, days(8))).toBe(false);
    expect(canReleaseEscrow({ ...held, escrowStatus: EscrowStatus.DISPUTED }, completed, false, days(8))).toBe(false);
  });

  it('derives status after refunds', () => {
    expect(escrowStatusAfterRefund(1000, 0)).toBe(EscrowStatus.RELEASED);
    expect(escrowStatusAfterRefund(1000, 400)).toBe(EscrowStatus.PARTIALLY_REFUNDED);
    expect(escrowStatusAfterRefund(1000, 1000)).toBe(EscrowStatus.REFUNDED);
  });
});
