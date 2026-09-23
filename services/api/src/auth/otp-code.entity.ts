import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { OtpPurpose } from '../common/enums';

@Entity('otp_codes')
@Index(['phone', 'purpose', 'createdAt'])
export class OtpCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Column({ type: 'enum', enum: OtpPurpose })
  purpose: OtpPurpose;

  /** bcrypt hash of the 6-digit code — the plain code is never stored. */
  @Column({ type: 'varchar' })
  codeHash: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Column({ type: 'timestamptz', nullable: true })
  consumedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
