import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity, GeoPoint } from '../common/base.entity';
import type { Country } from './country.entity';
import type { Site } from './site.entity';

@Entity('cities')
@Index(['countryId', 'name'], { unique: true })
export class City extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'uuid' })
  countryId: string;

  @ManyToOne('Country', (c: Country) => c.cities, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'countryId' })
  country: Country;

  @Index({ spatial: true })
  @Column({ type: 'geography', spatialFeatureType: 'Point', srid: 4326 })
  location: GeoPoint;

  @Column({ type: 'varchar', length: 64, default: 'UTC' })
  timezone: string;

  @OneToMany('Site', (s: Site) => s.city)
  sites: Site[];
}
