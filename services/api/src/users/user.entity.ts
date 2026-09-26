import { Column, Entity, Index, OneToOne } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { UserRole } from '../common/enums';
import type { Guide } from '../guides/guide.entity';

@Entity('users')
export class User extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'citext', nullable: true })
  email: string | null;

  /** E.164, e.g. +966500000000 */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', select: false, nullable: true })
  passwordHash: string | null;

  @Column({ type: 'varchar', length: 120 })
  fullName: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.TOURIST })
  role: UserRole;

  @Column({ type: 'timestamptz', nullable: true })
  phoneVerifiedAt: Date | null;

  @Column({ type: 'varchar', length: 8, default: 'en' })
  locale: string;

  @Column({ type: 'varchar', nullable: true })
  avatarUrl: string | null;

  @Column({ default: true })
  isActive: boolean;

  /** Consecutive failed password logins; reset on success. */
  @Column({ type: 'int', default: 0, select: false })
  failedLoginCount: number;

  @Column({ type: 'timestamptz', nullable: true, select: false })
  lockedUntil: Date | null;

  @OneToOne('Guide', (g: Guide) => g.user)
  guide?: Guide;
}
