import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity, GeoPoint } from '../common/base.entity';
import { SiteCategory } from '../common/enums';
import type { City } from './city.entity';

@Entity('sites')
export class Site extends BaseEntity {
  @Index()
  @Column({ type: 'varchar', length: 160 })
  name: string;

  @Column({ type: 'text', default: '' })
  description: string;

  @Column({ type: 'enum', enum: SiteCategory })
  category: SiteCategory;

  @Column({ type: 'uuid' })
  cityId: string;

  @ManyToOne('City', (c: City) => c.sites, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cityId' })
  city: City;

  @Index({ spatial: true })
  @Column({ type: 'geography', spatialFeatureType: 'Point', srid: 4326 })
  location: GeoPoint;

  @Column({ type: 'varchar', nullable: true })
  imageUrl: string | null;

  /** Whether local regulation requires a licensed guide to visit. */
  @Column({ default: false })
  requiresLicensedGuide: boolean;
}
