import { Check, Column, Entity, Index, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import type { Booking } from '../bookings/booking.entity';
import type { Guide } from '../guides/guide.entity';
import type { User } from '../users/user.entity';

@Entity('reviews')
@Check('"rating" BETWEEN 1 AND 5')
export class Review extends BaseEntity {
  /** One review per booking — enforced at DB level as well as in review.rules. */
  @Column({ type: 'uuid', unique: true })
  bookingId: string;

  @OneToOne('Booking', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookingId' })
  booking: Booking;

  @Index()
  @Column({ type: 'uuid' })
  guideId: string;

  @ManyToOne('Guide', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'guideId' })
  guide: Guide;

  @Column({ type: 'uuid' })
  authorId: string;

  @ManyToOne('User')
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column({ type: 'smallint' })
  rating: number;

  @Column({ type: 'text', default: '' })
  comment: string;

  @Column({ default: false })
  isHidden: boolean;
}
