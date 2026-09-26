import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { DataSource, In, Repository } from 'typeorm';
import { GuideVerificationStatus } from '../common/enums';
import { DomainError } from '../common/errors/domain-error';
import { City } from '../geo/city.entity';
import { Site } from '../geo/site.entity';
import { Guide } from '../guides/guide.entity';
import { GuidesService } from '../guides/guides.service';
import { STORAGE_PROVIDER, StorageProvider } from '../providers/storage/storage.interface';
import { CreatePackageDto, PackagePhotoUploadDto, UpdatePackageDto } from './dto';
import { PACKAGE_PHOTO_TYPES, packagePhotoPrefix, withPhotoUrls } from './package-photos';
import { TourPackage } from './tour-package.entity';

@Injectable()
export class PackagesService {
  constructor(
    @InjectRepository(TourPackage) private readonly packages: Repository<TourPackage>,
    private readonly guides: GuidesService,
    private readonly db: DataSource,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {}

  /** Public view — only active packages of approved guides. */
  async getPublic(id: string) {
    const pkg = await this.packages.findOne({
      where: { id, isActive: true, guide: { verificationStatus: GuideVerificationStatus.APPROVED } },
      relations: { sites: true, city: { country: true }, guide: { user: true } },
    });
    if (!pkg) throw new NotFoundException('Package not found');
    const { guide, ...rest } = pkg;
    const [withPhotos] = await withPhotoUrls(this.storage, [rest]);
    return { ...withPhotos, guide: { id: guide.id, name: guide.user.fullName, ratingAvg: guide.ratingAvg } };
  }

  async mine(userId: string) {
    const guide = await this.guides.getByUserId(userId);
    const pkgs = await this.packages.find({
      where: { guideId: guide.id },
      relations: { sites: true, city: { country: true } },
      order: { createdAt: 'DESC' },
    });
    return withPhotoUrls(this.storage, pkgs);
  }

  /** Signed upload for one tour photo; the returned key goes into `photoKeys`. */
  async createPhotoUpload(userId: string, dto: PackagePhotoUploadDto) {
    const guide = await this.guides.getByUserId(userId);
    const key = `${packagePhotoPrefix(guide.id)}${randomUUID()}.${PACKAGE_PHOTO_TYPES[dto.contentType]}`;
    return this.storage.createUpload({ key, contentType: dto.contentType, sizeBytes: dto.sizeBytes });
  }

  async create(userId: string, dto: CreatePackageDto) {
    const guide = await this.guideWithCities(userId);
    const city = await this.servedCity(guide, dto.cityId);
    const { siteIds, photoKeys, ...fields } = dto;
    const pkg = this.packages.create({
      ...fields,
      guideId: guide.id,
      currency: city.country.currency,
      languages: dto.languages ?? guide.languages,
      sites: await this.sitesIn(city.id, siteIds),
      photoKeys: await this.checkedPhotos(guide.id, photoKeys),
    });
    const saved = await this.packages.save(pkg);
    return this.present(saved.id);
  }

  async update(userId: string, id: string, dto: UpdatePackageDto) {
    const guide = await this.guideWithCities(userId);
    const pkg = await this.packages.findOne({ where: { id }, relations: { sites: true } });
    if (!pkg) throw new NotFoundException('Package not found');
    if (pkg.guideId !== guide.id) throw new ForbiddenException('Not your package');
    const { siteIds, photoKeys, ...fields } = dto;
    Object.assign(pkg, fields);
    if (dto.cityId && dto.cityId !== pkg.cityId) {
      const city = await this.servedCity(guide, dto.cityId);
      pkg.currency = city.country.currency;
      // Sites belong to a city: keep only the ones in the new city unless new ones are given.
      if (!siteIds) pkg.sites = pkg.sites.filter((s) => s.cityId === city.id);
    }
    if (siteIds) pkg.sites = await this.sitesIn(pkg.cityId, siteIds);
    if (photoKeys) pkg.photoKeys = await this.checkedPhotos(guide.id, photoKeys);
    await this.packages.save(pkg);
    return this.present(pkg.id);
  }

  private async present(id: string) {
    const pkg = await this.packages.findOneOrFail({ where: { id }, relations: { sites: true, city: { country: true } } });
    const [out] = await withPhotoUrls(this.storage, [pkg]);
    return out;
  }

  private async guideWithCities(userId: string) {
    const { id } = await this.guides.getByUserId(userId);
    return this.db.getRepository(Guide).findOneOrFail({ where: { id }, relations: { cities: true } });
  }

  /** Tours are offered in the cities on the guide's profile. */
  private async servedCity(guide: Guide, cityId: string) {
    const city = await this.db.getRepository(City).findOne({ where: { id: cityId }, relations: { country: true } });
    if (!city) throw new NotFoundException('City not found');
    if (guide.cities?.length && !guide.cities.some((c) => c.id === cityId)) {
      throw new DomainError('CITY_NOT_SERVED', 'Add this city to your profile before offering tours there');
    }
    return city;
  }

  private async sitesIn(cityId: string, siteIds?: string[]) {
    if (!siteIds?.length) return [];
    const sites = await this.db.getRepository(Site).findBy({ id: In(siteIds) });
    if (sites.length !== new Set(siteIds).size || sites.some((s) => s.cityId !== cityId)) {
      throw new DomainError('SITE_CITY_MISMATCH', 'Pick sites in the tour city');
    }
    return siteIds.map((id) => sites.find((s) => s.id === id)!);
  }

  /** Photo keys must be this guide's finished uploads. */
  private async checkedPhotos(guideId: string, keys?: string[]) {
    if (!keys?.length) return [];
    const unique = [...new Set(keys)];
    for (const key of unique) {
      if (!key.startsWith(packagePhotoPrefix(guideId)) || !(await this.storage.stat(key))) {
        throw new DomainError('PHOTO_NOT_UPLOADED', 'A photo has not finished uploading. Try adding it again.');
      }
    }
    return unique;
  }
}
