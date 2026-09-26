import { Column, Entity, Index, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { EscrowStatus } from '../common/enums';
import type { Booking } from '../bookings/booking.entity';

@Entity('payments')
// A gateway payment can only ever fund one booking.
@Index(['provider', 'providerRef'], { unique: true, where: '"providerRef" IS NOT NULL' })
export class Payment extends BaseEntity {
  @Column({ type: 'uuid', unique: true })
  bookingId: string;

  @OneToOne('Booking', (b: Booking) => b.payment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookingId' })
  booking: Booking;

  /** e.g. "stub", "stripe", "moyasar" */
  @Column({ type: 'varchar', length: 32 })
  provider: string;

  @Column({ type: 'varchar', nullable: true })
  providerRef: string | null;

  @Column({ type: 'int' })
  amountMinor: number;

  @Column({ type: 'char', length: 3 })
  currency: string;

  @Column({ type: 'enum', enum: EscrowStatus, default: EscrowStatus.PENDING })
  escrowStatus: EscrowStatus;

  @Column({ type: 'int', default: 0 })
  refundedMinor: number;

  @Column({ type: 'int', default: 0 })
  releasedMinor: number;

  @Column({ type: 'timestamptz', nullable: true })
  heldAt: Date | null;

  /** Earliest moment escrow may auto-release to the guide. */
  @Column({ type: 'timestamptz', nullable: true })
  releaseAfter: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  releasedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  refundedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  failureReason: string | null;

  /** Payout that covers `releasedMinor` (null = still owed to the guide). */
  @Index()
  @Column({ type: 'uuid', nullable: true })
  payoutId: string | null;

  @ManyToOne('Payout', { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'payoutId' })
  payout?: unknown;
}
