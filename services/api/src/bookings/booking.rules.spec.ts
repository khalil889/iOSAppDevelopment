import {
  BookingStatus,
  GuideVerificationStatus,
  PricingType,
  UserRole,
} from '../common/enums';
import { DomainError } from '../common/errors/domain-error';
import {
  assertCanCreateBooking,
  assertNoConflict,
  blocksCalendar,
  BookingCandidate,
  BookingState,
  bookingEnd,
  cancellationRefundPercent,
  isLicenseExpired,
  nextStatus,
  quotePrice,
  refundAmount,
} from './booking.rules';

const NOW = new Date('2026-05-01T08:00:00Z');
const hours = (h: number) => new Date(NOW.getTime() + h * 3_600_000);

function expectCode(fn: () => unknown, code: string) {
  try {
    fn();
  } catch (e) {
    expect(e).toBeInstanceOf(DomainError);
    expect((e as DomainError).code).toBe(code);
    return;
  }
  throw new Error(`Expected DomainError ${code} but nothing was thrown`);
}

function candidate(overrides: Partial<BookingCandidate> = {}): BookingCandidate {
  return {
    tourist: { id: 'tourist-1', role: UserRole.TOURIST, phoneVerifiedAt: NOW, isActive: true },
    guide: {
      id: 'guide-1',
      userId: 'guide-user-1',
      verificationStatus: GuideVerificationStatus.APPROVED,
      licenseExpiresAt: '2027-12-31',
    },
    pkg: { guideId: 'guide-1', isActive: true, maxGroupSize: 6, durationMinutes: 180 },
    startAt: hours(24),
    groupSize: 2,
    now: NOW,
    ...overrides,
  };
}

describe('quotePrice', () => {
  it('charges per group regardless of size', () => {
    const q = quotePrice({ pricingType: PricingType.PER_GROUP, priceMinor: 50_000, currency: 'SAR' }, 4, 15);
    expect(q).toEqual({
      subtotalMinor: 50_000,
      platformFeeMinor: 7_500,
      guidePayoutMinor: 42_500,
      totalMinor: 50_000,
      currency: 'SAR',
    });
  });

  it('multiplies per-person prices by group size', () => {
    const q = quotePrice({ pricingType: PricingType.PER_PERSON, priceMinor: 12_000, currency: 'EGP' }, 3, 15);
    expect(q.subtotalMinor).toBe(36_000);
    expect(q.platformFeeMinor).toBe(5_400);
    expect(q.guidePayoutMinor).toBe(30_600);
  });

  it('rounds the fee to whole minor units and keeps fee + payout = total', () => {
    const q = quotePrice({ pricingType: PricingType.PER_GROUP, priceMinor: 999, currency: 'USD' }, 1, 15);
    expect(Number.isInteger(q.platformFeeMinor)).toBe(true);
    expect(q.platformFeeMinor + q.guidePayoutMinor).toBe(q.totalMinor);
  });

  it('rejects invalid fee percentages', () => {
    expectCode(
      () => quotePrice({ pricingType: PricingType.PER_GROUP, priceMinor: 100, currency: 'USD' }, 1, 120),
      'INVALID_FEE',
    );
  });
});

describe('assertCanCreateBooking', () => {
  it('accepts a valid booking', () => {
    expect(() => assertCanCreateBooking(candidate())).not.toThrow();
  });

  it('only allows tourist accounts', () => {
    expectCode(
      () => assertCanCreateBooking(candidate({ tourist: { ...candidate().tourist, role: UserRole.GUIDE } })),
      'ONLY_TOURISTS_CAN_BOOK',
    );
  });

  it('requires a verified phone', () => {
    expectCode(
      () => assertCanCreateBooking(candidate({ tourist: { ...candidate().tourist, phoneVerifiedAt: null } })),
      'PHONE_NOT_VERIFIED',
    );
  });

  it.each([
    GuideVerificationStatus.DRAFT,
    GuideVerificationStatus.PENDING,
    GuideVerificationStatus.REJECTED,
    GuideVerificationStatus.SUSPENDED,
  ])('rejects guides with status %s', (status) => {
    expectCode(
      () => assertCanCreateBooking(candidate({ guide: { ...candidate().guide, verificationStatus: status } })),
      'GUIDE_NOT_VERIFIED',
    );
  });

  it('rejects when the guide license expires before the tour', () => {
    expectCode(
      () =>
        assertCanCreateBooking(
          candidate({ guide: { ...candidate().guide, licenseExpiresAt: '2026-05-01' }, startAt: hours(48) }),
        ),
      'GUIDE_LICENSE_EXPIRED',
    );
  });

  it('rejects a package from another guide', () => {
    expectCode(
      () => assertCanCreateBooking(candidate({ pkg: { ...candidate().pkg, guideId: 'other' } })),
      'PACKAGE_GUIDE_MISMATCH',
    );
  });

  it('rejects inactive packages', () => {
    expectCode(
      () => assertCanCreateBooking(candidate({ pkg: { ...candidate().pkg, isActive: false } })),
      'PACKAGE_INACTIVE',
    );
  });

  it.each([0, -1, 1.5])('rejects group size %p', (groupSize) => {
    expectCode(() => assertCanCreateBooking(candidate({ groupSize })), 'INVALID_GROUP_SIZE');
  });

  it('rejects groups larger than the package allows', () => {
    expectCode(() => assertCanCreateBooking(candidate({ groupSize: 7 })), 'GROUP_TOO_LARGE');
  });

  it('enforces the minimum lead time', () => {
    expectCode(() => assertCanCreateBooking(candidate({ startAt: hours(1) })), 'TOO_SOON');
    expect(() => assertCanCreateBooking(candidate({ startAt: hours(2) }))).not.toThrow();
  });

  it('rejects bookings too far in the future', () => {
    expectCode(() => assertCanCreateBooking(candidate({ startAt: hours(24 * 400) })), 'TOO_FAR_AHEAD');
  });

  it('stops guides booking themselves', () => {
    expectCode(
      () =>
        assertCanCreateBooking(
          candidate({ tourist: { ...candidate().tourist, id: 'guide-user-1' } }),
        ),
      'CANNOT_BOOK_SELF',
    );
  });
});

describe('calendar conflicts', () => {
  const slot = { startAt: hours(24), endAt: bookingEnd(hours(24), 180) };

  it('detects overlapping confirmed bookings', () => {
    expectCode(
      () =>
        assertNoConflict(
          slot,
          [{ startAt: hours(26), endAt: hours(28), status: BookingStatus.CONFIRMED, paymentDueAt: null }],
          NOW,
        ),
      'SLOT_UNAVAILABLE',
    );
  });

  it('allows back-to-back bookings', () => {
    expect(() =>
      assertNoConflict(
        slot,
        [{ startAt: hours(27), endAt: hours(29), status: BookingStatus.CONFIRMED, paymentDueAt: null }],
        NOW,
      ),
    ).not.toThrow();
  });

  it('ignores cancelled bookings and expired payment holds', () => {
    expect(() =>
      assertNoConflict(
        slot,
        [
          { startAt: hours(24), endAt: hours(27), status: BookingStatus.CANCELLED, paymentDueAt: null },
          { startAt: hours(24), endAt: hours(27), status: BookingStatus.PENDING_PAYMENT, paymentDueAt: hours(-1) },
        ],
        NOW,
      ),
    ).not.toThrow();
  });

  it('unpaid bookings block while their payment window is open', () => {
    expect(blocksCalendar({ status: BookingStatus.PENDING_PAYMENT, paymentDueAt: hours(0.25) }, NOW)).toBe(true);
    expect(blocksCalendar({ status: BookingStatus.COMPLETED, paymentDueAt: null }, NOW)).toBe(false);
  });
});

describe('nextStatus (lifecycle)', () => {
  const tourist = { id: 'tourist-1', role: UserRole.TOURIST };
  const guide = { id: 'guide-user-1', role: UserRole.GUIDE, guideId: 'guide-1' };
  const otherGuide = { id: 'guide-user-2', role: UserRole.GUIDE, guideId: 'guide-2' };
  const admin = { id: 'admin-1', role: UserRole.ADMIN };

  const booking = (status: BookingStatus, extra: Partial<BookingState> = {}): BookingState => ({
    touristId: 'tourist-1',
    guideId: 'guide-1',
    status,
    startAt: hours(24),
    paymentDueAt: hours(0.25),
    ...extra,
  });

  it('pay: PENDING_PAYMENT -> CONFIRMED by the tourist', () => {
    expect(nextStatus(booking(BookingStatus.PENDING_PAYMENT), 'pay', tourist, NOW)).toBe(BookingStatus.CONFIRMED);
  });

  it('pay: rejects other users and expired windows', () => {
    expectCode(() => nextStatus(booking(BookingStatus.PENDING_PAYMENT), 'pay', guide, NOW), 'NOT_BOOKING_OWNER');
    expectCode(
      () => nextStatus(booking(BookingStatus.PENDING_PAYMENT, { paymentDueAt: hours(-0.1) }), 'pay', tourist, NOW),
      'PAYMENT_WINDOW_EXPIRED',
    );
  });

  it('pay: cannot pay twice', () => {
    expectCode(() => nextStatus(booking(BookingStatus.CONFIRMED), 'pay', tourist, NOW), 'INVALID_TRANSITION');
  });

  it('start: only the assigned guide, not too early', () => {
    const b = booking(BookingStatus.CONFIRMED, { startAt: hours(0.25) });
    expect(nextStatus(b, 'start', guide, NOW)).toBe(BookingStatus.IN_PROGRESS);
    expectCode(() => nextStatus(b, 'start', otherGuide, NOW), 'NOT_BOOKING_GUIDE');
    expectCode(() => nextStatus(b, 'start', tourist, NOW), 'NOT_BOOKING_GUIDE');
    expectCode(() => nextStatus(booking(BookingStatus.CONFIRMED), 'start', guide, NOW), 'TOO_EARLY_TO_START');
  });

  it('complete: guide or admin, only from IN_PROGRESS', () => {
    expect(nextStatus(booking(BookingStatus.IN_PROGRESS), 'complete', guide, NOW)).toBe(BookingStatus.COMPLETED);
    expect(nextStatus(booking(BookingStatus.IN_PROGRESS), 'complete', admin, NOW)).toBe(BookingStatus.COMPLETED);
    expectCode(() => nextStatus(booking(BookingStatus.IN_PROGRESS), 'complete', tourist, NOW), 'NOT_BOOKING_GUIDE');
    expectCode(() => nextStatus(booking(BookingStatus.CONFIRMED), 'complete', guide, NOW), 'INVALID_TRANSITION');
  });

  it('cancel: participants or admin, not once the tour has started', () => {
    expect(nextStatus(booking(BookingStatus.CONFIRMED), 'cancel', tourist, NOW)).toBe(BookingStatus.CANCELLED);
    expect(nextStatus(booking(BookingStatus.CONFIRMED), 'cancel', guide, NOW)).toBe(BookingStatus.CANCELLED);
    expect(nextStatus(booking(BookingStatus.PENDING_PAYMENT), 'cancel', admin, NOW)).toBe(BookingStatus.CANCELLED);
    expectCode(() => nextStatus(booking(BookingStatus.CONFIRMED), 'cancel', otherGuide, NOW), 'NOT_PARTICIPANT');
    expectCode(() => nextStatus(booking(BookingStatus.IN_PROGRESS), 'cancel', tourist, NOW), 'INVALID_TRANSITION');
    expectCode(() => nextStatus(booking(BookingStatus.COMPLETED), 'cancel', admin, NOW), 'INVALID_TRANSITION');
  });
});

describe('cancellation refunds', () => {
  const tourist = { id: 'tourist-1', role: UserRole.TOURIST };
  const guide = { id: 'guide-user-1', role: UserRole.GUIDE, guideId: 'guide-1' };
  const b = (startInHours: number) => ({ touristId: 'tourist-1', startAt: hours(startInHours) });

  it.each([
    [72, 100],
    [48, 100],
    [47.9, 50],
    [24, 50],
    [23.9, 0],
    [3, 0],
  ])('tourist cancelling %sh before start gets %s%%', (h, pct) => {
    expect(cancellationRefundPercent(b(h), tourist, NOW)).toBe(pct);
  });

  it('guide cancellations are always fully refunded', () => {
    expect(cancellationRefundPercent(b(3), guide, NOW)).toBe(100);
  });

  it('computes refund amounts in minor units', () => {
    expect(refundAmount(50_001, 50)).toBe(25_001);
    expect(refundAmount(50_000, 0)).toBe(0);
  });
});

describe('isLicenseExpired', () => {
  it('treats the expiry date as valid through end of day UTC', () => {
    expect(isLicenseExpired('2026-05-01', new Date('2026-05-01T23:00:00Z'))).toBe(false);
    expect(isLicenseExpired('2026-05-01', new Date('2026-05-02T00:00:01Z'))).toBe(true);
    expect(isLicenseExpired(null, NOW)).toBe(false);
  });
});
