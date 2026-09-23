import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { DisputeResolution, DisputeStatus } from '../common/enums';
import type { Booking } from '../bookings/booking.entity';

@Entity('disputes')
export class Dispute extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  bookingId: string;

  @ManyToOne('Booking', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookingId' })
  booking: Booking;

  @Column({ type: 'uuid' })
  openedById: string;

  @Column({ type: 'varchar', length: 64 })
  reason: string;

  @Column({ type: 'text', default: '' })
  description: string;

  @Index()
  @Column({ type: 'enum', enum: DisputeStatus, default: DisputeStatus.OPEN })
  status: DisputeStatus;

  @Column({ type: 'enum', enum: DisputeResolution, nullable: true })
  resolution: DisputeResolution | null;

  /** Only for PARTIAL_REFUND: 1-99 */
  @Column({ type: 'int', nullable: true })
  refundPercent: number | null;

  @Column({ type: 'uuid', nullable: true })
  resolvedById: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  resolvedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  resolutionNote: string | null;
}
