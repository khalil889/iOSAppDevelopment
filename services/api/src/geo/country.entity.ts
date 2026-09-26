import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import type { City } from './city.entity';

@Entity('countries')
export class Country extends BaseEntity {
  /** ISO 3166-1 alpha-2 */
  @Column({ type: 'char', length: 2, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  /** Arabic name; sent instead of `name` to clients that ask for Arabic. */
  @Column({ type: 'varchar', length: 100, nullable: true })
  nameAr: string | null;

  /** ISO 4217 default currency for packages in this country */
  @Column({ type: 'char', length: 3 })
  currency: string;

  @OneToMany('City', (c: City) => c.country)
  cities: City[];
}
