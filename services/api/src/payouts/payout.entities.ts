import { Column, Entity, Index, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { PayoutStatus } from '../common/enums';
import type { Guide } from '../guides/guide.entity';

/** Where a guide's earnings are sent. The IBAN is stored encrypted (AES-GCM). */
@Entity('payout_accounts')
export class PayoutAccount extends BaseEntity {
  @Column({ type: 'uuid', unique: true })
  guideId: string;

  @OneToOne('Guide', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'guideId' })
  guide: Guide;

  @Column({ type: 'varchar', length: 120 })
  holderName: string;

  @Column({ type: 'text', select: false })
  ibanSealed: string;

  /** Country code + check digits + last four, safe to show. */
  @Column({ type: 'varchar', length: 16 })
  ibanMasked: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  bankName: string | null;
}

/** One batch of bank transfers, created by an admin for one currency. */
@Entity('payout_runs')
export class PayoutRun extends BaseEntity {
  @Column({ type: 'char', length: 3 })
  currency: string;

  @Column({ type: 'uuid' })
  createdById: string;

  @Column({ type: 'int' })
  totalMinor: number;

  @Column({ type: 'int' })
  payoutCount: number;

  /** Bank file downloads: a second upload to the bank would pay twice. */
  @Column({ type: 'int', default: 0 })
  exportCount: number;

  @Column({ type: 'timestamptz', nullable: true })
  lastExportedAt: Date | null;
}

/** Money sent (or to be sent) to one guide in one run. */
@Entity('payouts')
@Index(['guideId', 'createdAt'])
export class Payout extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  runId: string;

  @ManyToOne('PayoutRun', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'runId' })
  run: PayoutRun;

  @Column({ type: 'uuid' })
  guideId: string;

  @ManyToOne('Guide', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'guideId' })
  guide: Guide;

  @Column({ type: 'int' })
  amountMinor: number;

  @Column({ type: 'char', length: 3 })
  currency: string;

  @Column({ type: 'int' })
  paymentCount: number;

  @Column({ type: 'enum', enum: PayoutStatus, default: PayoutStatus.PENDING })
  status: PayoutStatus;

  /** Snapshot of the account used, so later edits don't change history. */
  @Column({ type: 'varchar', length: 120 })
  holderName: string;

  @Column({ type: 'text', select: false })
  ibanSealed: string;

  @Column({ type: 'varchar', length: 16 })
  ibanMasked: string;

  /** Bank transfer reference entered when marked paid, or the failure reason. */
  @Column({ type: 'varchar', length: 200, nullable: true })
  note: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  paidAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  settledById: string | null;
}
