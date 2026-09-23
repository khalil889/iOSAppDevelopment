/**
 * Pure booking business rules. No Nest / TypeORM imports so they can be unit
 * tested in isolation and reused by any caller (service, job, admin tool).
 */
import { DomainError } from '../common/errors/domain-error';
import {
  BookingStatus,
  GuideVerificationStatus,
  PricingType,
  UserRole,
} from '../common/enums';

export const BOOKING_RULES = {
  /** Tourists must book at least this far ahead so guides can prepare. */
  minLeadTimeMinutes: 120,
  maxAdvanceDays: 365,
  /** Unpaid bookings hold the slot for this long. */
  paymentWindowMinutes: 15,
  /** Guide may start the tour up to this long before the scheduled start. */
  startEarlyToleranceMinutes: 30,
  /** Full refund when a tourist cancels at least this long before start. */
  fullRefundHours: 48,
  /** 50% refund between this and fullRefundHours; nothing below. */
  partialRefundHours: 24,
  partialRefundPercent: 50,
} as const;

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// ---------------------------------------------------------------------------
// Pricing
// ---------------------------------------------------------------------------

export interface PriceQuote {
  subtotalMinor: number;
  platformFeeMinor: number;
  guidePayoutMinor: number;
  totalMinor: number;
  currency: string;
}

/**
 * The tourist pays the package price; the platform fee is deducted from the
 * guide's payout. All amounts are integer minor units.
 */
export function quotePrice(
  pkg: { pricingType: PricingType; priceMinor: number; currency: string },
  groupSize: number,
  platformFeePercent: number,
): PriceQuote {
  if (!Number.isInteger(pkg.priceMinor) || pkg.priceMinor < 0) {
    throw new DomainError('INVALID_PRICE', 'Package price must be a non-negative integer');
  }
  if (platformFeePercent < 0 || platformFeePercent > 100) {
    throw new DomainError('INVALID_FEE', 'Platform fee must be between 0 and 100 percent');
  }
  const subtotalMinor =
    pkg.pricingType === PricingType.PER_PERSON ? pkg.priceMinor * groupSize : pkg.priceMinor;
  const platformFeeMinor = Math.round((subtotalMinor * platformFeePercent) / 100);
  return {
    subtotalMinor,
    platformFeeMinor,
    guidePayoutMinor: subtotalMinor - platformFeeMinor,
    totalMinor: subtotalMinor,
    currency: pkg.currency,
  };
}

// ---------------------------------------------------------------------------
// Creation
// ---------------------------------------------------------------------------

export interface BookingCandidate {
  tourist: { id: string; role: UserRole; phoneVerifiedAt: Date | null; isActive: boolean };
  guide: { id: string; userId: string; verificationStatus: GuideVerificationStatus; licenseExpiresAt: string | null };
  pkg: { guideId: string; isActive: boolean; maxGroupSize: number; durationMinutes: number };
  startAt: Date;
  groupSize: number;
  now: Date;
}

export interface TimeSlot {
  startAt: Date;
  endAt: Date;
}

/** Throws DomainError if the tourist may not create this booking. */
export function assertCanCreateBooking(c: BookingCandidate): void {
  if (c.tourist.role !== UserRole.TOURIST) {
    throw new DomainError('ONLY_TOURISTS_CAN_BOOK', 'Only tourist accounts can create bookings', 'forbidden');
  }
  if (!c.tourist.isActive) {
    throw new DomainError('ACCOUNT_INACTIVE', 'Your account is inactive', 'forbidden');
  }
  if (!c.tourist.phoneVerifiedAt) {
    throw new DomainError('PHONE_NOT_VERIFIED', 'Verify your phone number before booking', 'forbidden');
  }
  if (c.guide.userId === c.tourist.id) {
    throw new DomainError('CANNOT_BOOK_SELF', 'You cannot book your own tour', 'forbidden');
  }
  if (c.guide.verificationStatus !== GuideVerificationStatus.APPROVED) {
    throw new DomainError('GUIDE_NOT_VERIFIED', 'This guide is not verified for bookings');
  }
  if (isLicenseExpired(c.guide.licenseExpiresAt, c.startAt)) {
    throw new DomainError('GUIDE_LICENSE_EXPIRED', "The guide's license is not valid on the tour date");
  }
  if (c.pkg.guideId !== c.guide.id) {
    throw new DomainError('PACKAGE_GUIDE_MISMATCH', 'Package does not belong to this guide');
  }
  if (!c.pkg.isActive) {
    throw new DomainError('PACKAGE_INACTIVE', 'This tour package is no longer available');
  }
  if (!Number.isInteger(c.groupSize) || c.groupSize < 1) {
    throw new DomainError('INVALID_GROUP_SIZE', 'Group size must be at least 1');
  }
  if (c.groupSize > c.pkg.maxGroupSize) {
    throw new DomainError(
      'GROUP_TOO_LARGE',
      `This package allows at most ${c.pkg.maxGroupSize} people`,
    );
  }
  if (Number.isNaN(c.startAt.getTime())) {
    throw new DomainError('INVALID_START', 'Invalid start time');
  }
  const leadMs = c.startAt.getTime() - c.now.getTime();
  if (leadMs < BOOKING_RULES.minLeadTimeMinutes * MINUTE) {
    throw new DomainError(
      'TOO_SOON',
      `Tours must be booked at least ${BOOKING_RULES.minLeadTimeMinutes / 60} hours in advance`,
    );
  }
  if (leadMs > BOOKING_RULES.maxAdvanceDays * DAY) {
    throw new DomainError('TOO_FAR_AHEAD', `Tours can be booked at most ${BOOKING_RULES.maxAdvanceDays} days ahead`);
  }
}

export function bookingEnd(startAt: Date, durationMinutes: number): Date {
  return new Date(startAt.getTime() + durationMinutes * MINUTE);
}

export function overlaps(a: TimeSlot, b: TimeSlot): boolean {
  return a.startAt < b.endAt && b.startAt < a.endAt;
}

/**
 * Whether an existing booking still occupies the guide's calendar.
 * Unpaid bookings stop blocking once their payment window lapses.
 */
export function blocksCalendar(
  b: { status: BookingStatus; paymentDueAt: Date | null },
  now: Date,
): boolean {
  switch (b.status) {
    case BookingStatus.CONFIRMED:
    case BookingStatus.IN_PROGRESS:
      return true;
    case BookingStatus.PENDING_PAYMENT:
      return !!b.paymentDueAt && b.paymentDueAt > now;
    default:
      return false;
  }
}

export function assertNoConflict(
  slot: TimeSlot,
  existing: Array<TimeSlot & { status: BookingStatus; paymentDueAt: Date | null }>,
  now: Date,
): void {
  const clash = existing.find((b) => blocksCalendar(b, now) && overlaps(slot, b));
  if (clash) {
    throw new DomainError('SLOT_UNAVAILABLE', 'The guide is already booked at that time', 'conflict');
  }
}

export function isLicenseExpired(licenseExpiresAt: string | null, at: Date): boolean {
  if (!licenseExpiresAt) return false;
  // License is valid through the end of its expiry date (UTC).
  const endOfDay = new Date(`${licenseExpiresAt}T23:59:59.999Z`);
  return endOfDay < at;
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

export type BookingAction = 'pay' | 'start' | 'complete' | 'cancel';

const TRANSITIONS: Record<BookingAction, { from: BookingStatus[]; to: BookingStatus }> = {
  pay: { from: [BookingStatus.PENDING_PAYMENT], to: BookingStatus.CONFIRMED },
  start: { from: [BookingStatus.CONFIRMED], to: BookingStatus.IN_PROGRESS },
  complete: { from: [BookingStatus.IN_PROGRESS], to: BookingStatus.COMPLETED },
  cancel: {
    from: [BookingStatus.PENDING_PAYMENT, BookingStatus.CONFIRMED],
    to: BookingStatus.CANCELLED,
  },
};

export interface BookingActor {
  id: string;
  role: UserRole;
  /** Guide profile id when the actor is a guide. */
  guideId?: string | null;
}

export interface BookingState {
  touristId: string;
  guideId: string;
  status: BookingStatus;
  startAt: Date;
  paymentDueAt: Date | null;
}

export function isTourist(b: Pick<BookingState, 'touristId'>, a: BookingActor) {
  return a.id === b.touristId;
}

export function isGuide(b: Pick<BookingState, 'guideId'>, a: BookingActor) {
  return !!a.guideId && a.guideId === b.guideId;
}

export function isParticipant(b: Pick<BookingState, 'touristId' | 'guideId'>, a: BookingActor) {
  return isTourist(b, a) || isGuide(b, a);
}

/**
 * Validates that `actor` may perform `action` on the booking at `now` and
 * returns the resulting status.
 */
export function nextStatus(
  b: BookingState,
  action: BookingAction,
  actor: BookingActor,
  now: Date,
): BookingStatus {
  const t = TRANSITIONS[action];
  if (!t.from.includes(b.status)) {
    throw new DomainError(
      'INVALID_TRANSITION',
      `Cannot ${action} a booking that is ${b.status}`,
      'conflict',
    );
  }

  const admin = actor.role === UserRole.ADMIN;
  switch (action) {
    case 'pay':
      if (!isTourist(b, actor)) {
        throw new DomainError('NOT_BOOKING_OWNER', 'Only the tourist can pay for this booking', 'forbidden');
      }
      if (b.paymentDueAt && b.paymentDueAt <= now) {
        throw new DomainError('PAYMENT_WINDOW_EXPIRED', 'The payment window has expired; please book again', 'conflict');
      }
      break;
    case 'start': {
      if (!isGuide(b, actor)) {
        throw new DomainError('NOT_BOOKING_GUIDE', 'Only the assigned guide can start this tour', 'forbidden');
      }
      const earliest = b.startAt.getTime() - BOOKING_RULES.startEarlyToleranceMinutes * MINUTE;
      if (now.getTime() < earliest) {
        throw new DomainError('TOO_EARLY_TO_START', 'The tour cannot be started yet');
      }
      break;
    }
    case 'complete':
      if (!isGuide(b, actor) && !admin) {
        throw new DomainError('NOT_BOOKING_GUIDE', 'Only the assigned guide can complete this tour', 'forbidden');
      }
      break;
    case 'cancel':
      if (!isParticipant(b, actor) && !admin) {
        throw new DomainError('NOT_PARTICIPANT', 'You are not part of this booking', 'forbidden');
      }
      break;
  }
  return t.to;
}

/**
 * Percentage (0-100) of the paid amount returned to the tourist on
 * cancellation. Guide- or admin-initiated cancellations are always refunded
 * in full; tourist cancellations follow the 48h / 24h policy.
 */
export function cancellationRefundPercent(
  b: Pick<BookingState, 'touristId' | 'startAt'>,
  actor: BookingActor,
  now: Date,
): number {
  if (!isTourist(b, actor)) return 100;
  const hoursBefore = (b.startAt.getTime() - now.getTime()) / HOUR;
  if (hoursBefore >= BOOKING_RULES.fullRefundHours) return 100;
  if (hoursBefore >= BOOKING_RULES.partialRefundHours) return BOOKING_RULES.partialRefundPercent;
  return 0;
}

export function refundAmount(amountMinor: number, percent: number): number {
  return Math.round((amountMinor * percent) / 100);
}
