import { BookingStatus } from '../common/enums';
import { DomainError } from '../common/errors/domain-error';
import { assertCanReview, ratingAggregate, ReviewCandidate } from './review.rules';

const COMPLETED_AT = new Date('2026-05-01T12:00:00Z');
const days = (d: number) => new Date(COMPLETED_AT.getTime() + d * 86_400_000);

function candidate(overrides: Partial<ReviewCandidate> = {}): ReviewCandidate {
  return {
    booking: { touristId: 'tourist-1', status: BookingStatus.COMPLETED, completedAt: COMPLETED_AT },
    authorId: 'tourist-1',
    rating: 5,
    comment: 'Fantastic guide',
    alreadyReviewed: false,
    now: days(1),
    windowDays: 30,
    ...overrides,
  };
}

function expectCode(fn: () => unknown, code: string) {
  expect(fn).toThrow(DomainError);
  try {
    fn();
  } catch (e) {
    expect((e as DomainError).code).toBe(code);
  }
}

describe('assertCanReview', () => {
  it('allows the tourist to review a completed booking', () => {
    expect(() => assertCanReview(candidate())).not.toThrow();
  });

  it.each([
    BookingStatus.PENDING_PAYMENT,
    BookingStatus.CONFIRMED,
    BookingStatus.IN_PROGRESS,
    BookingStatus.CANCELLED,
  ])('rejects reviews for %s bookings', (status) => {
    expectCode(
      () => assertCanReview(candidate({ booking: { ...candidate().booking, status } })),
      'BOOKING_NOT_COMPLETED',
    );
  });

  it('rejects a COMPLETED booking missing completedAt (inconsistent data)', () => {
    expectCode(
      () => assertCanReview(candidate({ booking: { ...candidate().booking, completedAt: null } })),
      'BOOKING_NOT_COMPLETED',
    );
  });

  it('only the booking tourist can review', () => {
    expectCode(() => assertCanReview(candidate({ authorId: 'someone-else' })), 'NOT_BOOKING_OWNER');
  });

  it('allows only one review per booking', () => {
    expectCode(() => assertCanReview(candidate({ alreadyReviewed: true })), 'ALREADY_REVIEWED');
  });

  it('closes the review window after N days', () => {
    expect(() => assertCanReview(candidate({ now: days(30) }))).not.toThrow();
    expectCode(() => assertCanReview(candidate({ now: days(30.01) })), 'REVIEW_WINDOW_CLOSED');
  });

  it.each([0, 6, 4.5, NaN])('rejects rating %p', (rating) => {
    expectCode(() => assertCanReview(candidate({ rating })), 'INVALID_RATING');
  });

  it('limits comment length', () => {
    expectCode(() => assertCanReview(candidate({ comment: 'x'.repeat(2001) })), 'COMMENT_TOO_LONG');
    expect(() => assertCanReview(candidate({ comment: null }))).not.toThrow();
  });

  it('checks ownership before revealing booking state', () => {
    expectCode(
      () =>
        assertCanReview(
          candidate({ authorId: 'intruder', booking: { ...candidate().booking, status: BookingStatus.CANCELLED } }),
        ),
      'NOT_BOOKING_OWNER',
    );
  });
});

describe('ratingAggregate', () => {
  it('averages ratings to two decimals', () => {
    expect(ratingAggregate([5, 4, 4])).toEqual({ ratingAvg: 4.33, ratingCount: 3 });
  });

  it('returns zeros with no reviews', () => {
    expect(ratingAggregate([])).toEqual({ ratingAvg: 0, ratingCount: 0 });
  });
});
