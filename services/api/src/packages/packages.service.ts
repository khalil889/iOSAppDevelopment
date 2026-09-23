import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { GuideVerificationStatus } from '../common/enums';
import { City } from '../geo/city.entity';
import { Site } from '../geo/site.entity';
import { GuidesService } from '../guides/guides.service';
import { CreatePackageDto, UpdatePackageDto } from './dto';
import { TourPackage } from './tour-package.entity';

@Injectable()
export class PackagesService {
  constructor(
    @InjectRepository(TourPackage) private readonly packages: Repository<TourPackage>,
    private readonly guides: GuidesService,
    private readonly db: DataSource,
  ) {}

  /** Public view — only active packages of approved guides. */
  async getPublic(id: string) {
    const pkg = await this.packages.findOne({
      where: { id, isActive: true, guide: { verificationStatus: GuideVerificationStatus.APPROVED } },
      relations: { sites: true, city: { country: true }, guide: { user: true } },
    });
    if (!pkg) throw new NotFoundException('Package not found');
    const { guide, ...rest } = pkg;
    return { ...rest, guide: { id: guide.id, name: guide.user.fullName, ratingAvg: guide.ratingAvg } };
  }

  async mine(userId: string) {
    const guide = await this.guides.getByUserId(userId);
    return this.packages.find({ where: { guideId: guide.id }, relations: { sites: true, city: true }, order: { createdAt: 'DESC' } });
  }

  async create(userId: string, dto: CreatePackageDto) {
    const guide = await this.guides.getByUserId(userId);
    if (!(await this.db.getRepository(City).existsBy({ id: dto.cityId }))) throw new NotFoundException('City not found');
    const { siteIds, ...fields } = dto;
    const pkg = this.packages.create({
      ...fields,
      guideId: guide.id,
      languages: dto.languages ?? guide.languages,
      sites: siteIds?.length ? await this.db.getRepository(Site).findBy({ id: In(siteIds) }) : [],
    });
    return this.packages.save(pkg);
  }

  async update(userId: string, id: string, dto: UpdatePackageDto) {
    const guide = await this.guides.getByUserId(userId);
    const pkg = await this.packages.findOne({ where: { id }, relations: { sites: true } });
    if (!pkg) throw new NotFoundException('Package not found');
    if (pkg.guideId !== guide.id) throw new ForbiddenException('Not your package');
    const { siteIds, ...fields } = dto;
    Object.assign(pkg, fields);
    if (siteIds) pkg.sites = await this.db.getRepository(Site).findBy({ id: In(siteIds) });
    return this.packages.save(pkg);
  }
}
