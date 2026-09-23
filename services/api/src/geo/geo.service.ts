import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paginated } from '../common/pagination';
import { City } from './city.entity';
import { Country } from './country.entity';
import { CityQuery, SiteSearchQuery } from './dto';
import { Site } from './site.entity';

export type SiteWithDistance = Site & { distanceKm?: number };

@Injectable()
export class GeoService {
  constructor(
    @InjectRepository(Country) private readonly countries: Repository<Country>,
    @InjectRepository(City) private readonly cities: Repository<City>,
    @InjectRepository(Site) private readonly sites: Repository<Site>,
  ) {}

  listCountries() {
    return this.countries.find({ order: { name: 'ASC' } });
  }

  listCities(q: CityQuery) {
    const qb = this.cities.createQueryBuilder('c').leftJoinAndSelect('c.country', 'country').orderBy('c.name', 'ASC');
    if (q.countryId) qb.andWhere('c.countryId = :countryId', { countryId: q.countryId });
    if (q.q) qb.andWhere('c.name ILIKE :q', { q: `%${q.q}%` });
    return qb.getMany();
  }

  async searchSites(q: SiteSearchQuery): Promise<Paginated<SiteWithDistance>> {
    const qb = this.sites
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.city', 'city')
      .leftJoinAndSelect('city.country', 'country');

    if (q.q) qb.andWhere('(s.name ILIKE :q OR s.description ILIKE :q)', { q: `%${q.q}%` });
    if (q.cityId) qb.andWhere('s.cityId = :cityId', { cityId: q.cityId });
    if (q.countryId) qb.andWhere('city.countryId = :countryId', { countryId: q.countryId });
    if (q.category) qb.andWhere('s.category = :category', { category: q.category });

    const near = q.lat !== undefined && q.lng !== undefined;
    if (near) {
      const point = 'ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography';
      qb.setParameters({ lat: q.lat, lng: q.lng, radiusM: (q.radiusKm ?? 25) * 1000 })
        .addSelect(`ST_Distance(s.location, ${point}) / 1000`, 'distance_km')
        .andWhere(`ST_DWithin(s.location, ${point}, :radiusM)`)
        .orderBy('distance_km', 'ASC');
    } else {
      qb.orderBy('s.name', 'ASC');
    }

    const total = await qb.getCount();
    qb.offset((q.page - 1) * q.limit).limit(q.limit);
    const { entities, raw } = await qb.getRawAndEntities();
    const items = entities.map((s) => {
      const r = raw.find((row) => row.s_id === s.id);
      return near ? Object.assign(s, { distanceKm: Number(Number(r?.distance_km).toFixed(2)) }) : s;
    });
    return { items, total, page: q.page, limit: q.limit };
  }

  async getSite(id: string) {
    const site = await this.sites.findOne({ where: { id }, relations: { city: { country: true } } });
    if (!site) throw new NotFoundException('Site not found');
    return site;
  }

  async getCity(id: string) {
    const city = await this.cities.findOne({ where: { id }, relations: { country: true } });
    if (!city) throw new NotFoundException('City not found');
    return city;
  }
}
