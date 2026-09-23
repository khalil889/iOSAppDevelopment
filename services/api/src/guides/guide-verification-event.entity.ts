import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { GuideVerificationStatus } from '../common/enums';
import type { Guide } from './guide.entity';

/** Append-only audit trail of verification decisions. */
@Entity('guide_verification_events')
export class GuideVerificationEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  guideId: string;

  @ManyToOne('Guide', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'guideId' })
  guide: Guide;

  @Column({ type: 'enum', enum: GuideVerificationStatus })
  fromStatus: GuideVerificationStatus;

  @Column({ type: 'enum', enum: GuideVerificationStatus })
  toStatus: GuideVerificationStatus;

  /** null when the change was made by the guide (e.g. submission) */
  @Column({ type: 'uuid', nullable: true })
  actorId: string | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
