import {
  Column,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToOne,
} from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { GuideVerificationStatus, IdentityStatus, KycStatus } from '../common/enums';
import type { User } from '../users/user.entity';
import type { Country } from '../geo/country.entity';
import type { City } from '../geo/city.entity';
import type { Site } from '../geo/site.entity';

@Entity('guides')
export class Guide extends BaseEntity {
  @Column({ type: 'uuid', unique: true })
  userId: string;

  @OneToOne('User', (u: User) => u.guide, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'text', default: '' })
  bio: string;

  /** ISO 639-1 codes, e.g. {en,ar} */
  @Column({ type: 'text', array: true, default: '{}' })
  languages: string[];

  @Column({ type: 'int', default: 0 })
  yearsOfExperience: number;

  // --- License / verification -------------------------------------------
  @Index({ unique: true, where: '"licenseNumber" IS NOT NULL' })
  @Column({ type: 'varchar', length: 64, nullable: true })
  licenseNumber: string | null;

  @Column({ type: 'uuid', nullable: true })
  licenseCountryId: string | null;

  @ManyToOne('Country', { nullable: true })
  @JoinColumn({ name: 'licenseCountryId' })
  licenseCountry: Country | null;

  @Column({ type: 'date', nullable: true })
  licenseExpiresAt: string | null;

  /** Legacy: link pasted by the guide before uploads existed. */
  @Column({ type: 'varchar', nullable: true })
  licenseDocumentUrl: string | null;

  /** Private storage key of the uploaded license scan (see StorageProvider). */
  @Column({ type: 'varchar', nullable: true, select: false })
  licenseDocumentKey: string | null;

  @Index()
  @Column({
    type: 'enum',
    enum: GuideVerificationStatus,
    default: GuideVerificationStatus.DRAFT,
  })
  verificationStatus: GuideVerificationStatus;

  @Column({ type: 'timestamptz', nullable: true })
  submittedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  verifiedAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  verifiedById: string | null;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string | null;

  // --- KYC (provider-agnostic) --------------------------------------------
  @Column({ type: 'enum', enum: KycStatus, default: KycStatus.NOT_STARTED })
  kycStatus: KycStatus;

  @Column({ type: 'varchar', nullable: true })
  kycReference: string | null;

  @Column({ type: 'jsonb', nullable: true })
  kycResult: Record<string, unknown> | null;

  // --- Identity verification (ID document + selfie, e.g. Sumsub) ---------
  @Column({ type: 'enum', enum: IdentityStatus, default: IdentityStatus.NOT_STARTED })
  identityStatus: IdentityStatus;

  /** Provider's applicant id (Sumsub applicantId). */
  @Column({ type: 'varchar', length: 64, nullable: true })
  identityApplicantId: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  identityCheckedAt: Date | null;

  /** Provider reject labels and the message meant for the guide. */
  @Column({ type: 'jsonb', nullable: true })
  identityReview: { labels?: string[]; comment?: string | null } | null;

  // --- Denormalised rating (recomputed when reviews change) --------------
  @Column({ type: 'numeric', precision: 3, scale: 2, default: 0, transformer: { to: (v) => v, from: (v) => Number(v) } })
  ratingAvg: number;

  @Column({ type: 'int', default: 0 })
  ratingCount: number;

  // --- Coverage -----------------------------------------------------------
  @ManyToMany('City')
  @JoinTable({ name: 'guide_cities', joinColumn: { name: 'guideId' }, inverseJoinColumn: { name: 'cityId' } })
  cities: City[];

  @ManyToMany('Site')
  @JoinTable({ name: 'guide_sites', joinColumn: { name: 'guideId' }, inverseJoinColumn: { name: 'siteId' } })
  sites: Site[];
}
