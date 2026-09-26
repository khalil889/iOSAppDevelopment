import { Column, Entity, Index, JoinColumn, JoinTable, ManyToMany, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { PricingType } from '../common/enums';
import type { Guide } from '../guides/guide.entity';
import type { City } from '../geo/city.entity';
import type { Site } from '../geo/site.entity';

@Entity('tour_packages')
export class TourPackage extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  guideId: string;

  @ManyToOne('Guide', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'guideId' })
  guide: Guide;

  @Index()
  @Column({ type: 'uuid' })
  cityId: string;

  @ManyToOne('City')
  @JoinColumn({ name: 'cityId' })
  city: City;

  @Column({ type: 'varchar', length: 160 })
  title: string;

  @Column({ type: 'text', default: '' })
  description: string;

  /** Arabic title/description written by the guide (optional). */
  @Column({ type: 'varchar', length: 160, nullable: true })
  titleAr: string | null;

  @Column({ type: 'text', nullable: true })
  descriptionAr: string | null;

  @Column({ type: 'int' })
  durationMinutes: number;

  @Column({ type: 'enum', enum: PricingType, default: PricingType.PER_GROUP })
  pricingType: PricingType;

  /** Price in minor units (e.g. halalas / cents) — never floats for money. */
  @Column({ type: 'int' })
  priceMinor: number;

  @Column({ type: 'char', length: 3 })
  currency: string;

  @Column({ type: 'int', default: 8 })
  maxGroupSize: number;

  @Column({ type: 'text', array: true, default: '{}' })
  languages: string[];

  @Column({ default: true })
  isActive: boolean;

  /** Storage keys of the tour photos, in display order (first = cover). */
  @Column({ type: 'text', array: true, default: '{}' })
  photoKeys: string[];

  @ManyToMany('Site')
  @JoinTable({ name: 'tour_package_sites', joinColumn: { name: 'packageId' }, inverseJoinColumn: { name: 'siteId' } })
  sites: Site[];
}
