import { DomainError } from '../common/errors/domain-error';
import { BookingStatus } from '../common/enums';

export const REVIEW_RULES = {
  minRating: 1,
  maxRating: 5,
  maxCommentLength: 2000,
} as const;

export interface ReviewCandidate {
  booking: {
    touristId: string;
    status: BookingStatus;
    completedAt: Date | null;
  };
  authorId: string;
  rating: number;
  comment?: string | null;
  alreadyReviewed: boolean;
  now: Date;
  windowDays: number;
}

/**
 * Reviews are only allowed for COMPLETED bookings, by the tourist who made
 * the booking, once per booking, within `windowDays` of completion.
 */
export function assertCanReview(c: ReviewCandidate): void {
  if (c.booking.touristId !== c.authorId) {
    throw new DomainError('NOT_BOOKING_OWNER', 'Only the tourist who booked can review this tour', 'forbidden');
  }
  if (c.booking.status !== BookingStatus.COMPLETED || !c.booking.completedAt) {
    throw new DomainError('BOOKING_NOT_COMPLETED', 'You can only review a completed tour');
  }
  if (c.alreadyReviewed) {
    throw new DomainError('ALREADY_REVIEWED', 'You have already reviewed this booking', 'conflict');
  }
  const deadline = c.booking.completedAt.getTime() + c.windowDays * 24 * 60 * 60 * 1000;
  if (c.now.getTime() > deadline) {
    throw new DomainError('REVIEW_WINDOW_CLOSED', `Reviews must be left within ${c.windowDays} days of the tour`);
  }
  if (
    !Number.isInteger(c.rating) ||
    c.rating < REVIEW_RULES.minRating ||
    c.rating > REVIEW_RULES.maxRating
  ) {
    throw new DomainError('INVALID_RATING', 'Rating must be a whole number from 1 to 5');
  }
  if ((c.comment ?? '').length > REVIEW_RULES.maxCommentLength) {
    throw new DomainError('COMMENT_TOO_LONG', `Comment must be at most ${REVIEW_RULES.maxCommentLength} characters`);
  }
}

/** Average rounded to 2 decimals, matching guides.ratingAvg numeric(3,2). */
export function ratingAggregate(ratings: number[]): { ratingAvg: number; ratingCount: number } {
  if (!ratings.length) return { ratingAvg: 0, ratingCount: 0 };
  const sum = ratings.reduce((a, b) => a + b, 0);
  return { ratingAvg: Math.round((sum / ratings.length) * 100) / 100, ratingCount: ratings.length };
}
