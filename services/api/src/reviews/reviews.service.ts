import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, EntityManager } from 'typeorm';
import { Booking } from '../bookings/booking.entity';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { Guide } from '../guides/guide.entity';
import { CreateReviewDto } from './dto';
import { Review } from './review.entity';
import { assertCanReview, ratingAggregate } from './review.rules';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly db: DataSource,
    private readonly config: ConfigService,
  ) {}

  async create(user: AuthUser, bookingId: string, dto: CreateReviewDto) {
    return this.db.transaction(async (tx) => {
      // Lock the booking row so concurrent submissions can't both pass the check.
      const booking = await tx.getRepository(Booking).findOne({
        where: { id: bookingId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!booking) throw new NotFoundException('Booking not found');

      const alreadyReviewed = await tx.getRepository(Review).existsBy({ bookingId });
      assertCanReview({
        booking,
        authorId: user.id,
        rating: dto.rating,
        comment: dto.comment,
        alreadyReviewed,
        now: new Date(),
        windowDays: this.config.get<number>('marketplace.reviewWindowDays')!,
      });

      const review = await tx.getRepository(Review).save(
        tx.getRepository(Review).create({
          bookingId,
          guideId: booking.guideId,
          authorId: user.id,
          rating: dto.rating,
          comment: dto.comment?.trim() ?? '',
        }),
      );
      await this.recomputeGuideRating(booking.guideId, tx);
      return review;
    });
  }

  async recomputeGuideRating(guideId: string, em: EntityManager = this.db.manager) {
    const rows: Array<{ rating: number }> = await em
      .getRepository(Review)
      .find({ where: { guideId, isHidden: false }, select: { rating: true } });
    await em.getRepository(Guide).update({ id: guideId }, ratingAggregate(rows.map((r) => r.rating)));
  }
}
