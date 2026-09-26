import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import type { User } from '../users/user.entity';

@Entity('device_tokens')
export class DeviceToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  /** FCM registration token. A token moves to whoever signs in on that device. */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 512 })
  token: string;

  @Column({ type: 'varchar', length: 16 })
  platform: 'android' | 'ios' | 'web';

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  lastSeenAt: Date;
}

export enum NotificationType {
  BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',
  NEW_BOOKING = 'NEW_BOOKING',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
  TOUR_STARTED = 'TOUR_STARTED',
  TOUR_COMPLETED = 'TOUR_COMPLETED',
  REVIEW_REMINDER = 'REVIEW_REMINDER',
  SOS_RAISED = 'SOS_RAISED',
  SOS_ACKNOWLEDGED = 'SOS_ACKNOWLEDGED',
  GUIDE_APPROVED = 'GUIDE_APPROVED',
  GUIDE_REJECTED = 'GUIDE_REJECTED',
  DISPUTE_OPENED = 'DISPUTE_OPENED',
  DISPUTE_RESOLVED = 'DISPUTE_RESOLVED',
  IDENTITY_VERIFIED = 'IDENTITY_VERIFIED',
  IDENTITY_NEEDS_ACTION = 'IDENTITY_NEEDS_ACTION',
  PAYOUT_SENT = 'PAYOUT_SENT',
}

/** In-app inbox; every push is also stored here so nothing is lost if push is off. */
@Entity('notifications')
@Index(['userId', 'createdAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column({ type: 'varchar', length: 160 })
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'jsonb', default: {} })
  data: Record<string, string>;

  @Column({ type: 'timestamptz', nullable: true })
  readAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
