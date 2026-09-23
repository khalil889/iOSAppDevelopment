import { Column, Entity, Index, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { BookingStatus } from '../common/enums';
import type { User } from '../users/user.entity';
import type { Guide } from '../guides/guide.entity';
import type { TourPackage } from '../packages/tour-package.entity';
import type { Payment } from '../payments/payment.entity';

@Entity('bookings')
@Index(['guideId', 'startAt'])
export class Booking extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  touristId: string;

  @ManyToOne('User')
  @JoinColumn({ name: 'touristId' })
  tourist: User;

  @Column({ type: 'uuid' })
  guideId: string;

  @ManyToOne('Guide')
  @JoinColumn({ name: 'guideId' })
  guide: Guide;

  @Column({ type: 'uuid' })
  packageId: string;

  @ManyToOne('TourPackage')
  @JoinColumn({ name: 'packageId' })
  package: TourPackage;

  @Index()
  @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.PENDING_PAYMENT })
  status: BookingStatus;

  @Column({ type: 'timestamptz' })
  startAt: Date;

  @Column({ type: 'timestamptz' })
  endAt: Date;

  @Column({ type: 'int' })
  groupSize: number;

  // Price snapshot at booking time (minor units)
  @Column({ type: 'int' })
  subtotalMinor: number;

  @Column({ type: 'int' })
  platformFeeMinor: number;

  @Column({ type: 'int' })
  guidePayoutMinor: number;

  @Column({ type: 'int' })
  totalMinor: number;

  @Column({ type: 'char', length: 3 })
  currency: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  /** Unpaid bookings stop blocking the guide's calendar after this. */
  @Column({ type: 'timestamptz', nullable: true })
  paymentDueAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  cancelledAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  cancelledById: string | null;

  @Column({ type: 'text', nullable: true })
  cancellationReason: string | null;

  @OneToOne('Payment', (p: Payment) => p.booking)
  payment?: Payment;
}
