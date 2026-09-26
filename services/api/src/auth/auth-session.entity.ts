import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import type { User } from '../users/user.entity';

/**
 * One refresh token in a rotation chain. Each refresh revokes the presented
 * token and issues a new one in the same family; presenting an already-used
 * token means it leaked, so the whole family is revoked.
 */
@Entity('auth_sessions')
export class AuthSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  /** All tokens descending from one sign-in share a family. */
  @Index()
  @Column({ type: 'uuid' })
  familyId: string;

  /** sha256 of the refresh token; the token itself is never stored. */
  @Index({ unique: true })
  @Column({ type: 'char', length: 64 })
  tokenHash: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  replacedById: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  userAgent: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
