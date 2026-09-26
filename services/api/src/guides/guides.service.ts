import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { BookingStatus, EscrowStatus, GuideVerificationStatus, KycStatus } from '../common/enums';
import { Paginated } from '../common/pagination';
import { Booking } from '../bookings/booking.entity';
import { City } from '../geo/city.entity';
import { Country } from '../geo/country.entity';
import { Site } from '../geo/site.entity';
import { TourPackage } from '../packages/tour-package.entity';
import { KYC_PROVIDER, KycProvider } from '../providers/kyc/kyc-provider.interface';
import { STORAGE_PROVIDER, StorageProvider } from '../providers/storage/storage.interface';
import { DomainError } from '../common/errors/domain-error';
import { Review } from '../reviews/review.entity';
import { GuideSearchQuery, LICENSE_CONTENT_TYPES, LicenseUploadDto, SubmitApplicationDto, UpdateGuideProfileDto } from './dto';
import { GuideVerificationEvent } from './guide-verification-event.entity';
import { assertCanSubmitApplication } from './guide-verification.rules';
import { Guide } from './guide.entity';
import { presentGuide, PublicGuide } from './guide.presenter';

const KYC_MAP: Record<string, KycStatus> = { clear: KycStatus.CLEAR, consider: KycStatus.CONSIDER, failed: KycStatus.FAILED };

@Injectable()
export class GuidesService {
  constructor(
    @InjectRepository(Guide) private readonly guides: Repository<Guide>,
    private readonly db: DataSource,
    @Inject(KYC_PROVIDER) private readonly kyc: KycProvider,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {}

  // ---------------------------------------------------------------- search
  async search(q: GuideSearchQuery): Promise<Paginated<PublicGuide>> {
    const fromPrice =
      '(SELECT MIN(p."priceMinor") FROM tour_packages p WHERE p."guideId" = g.id AND p."isActive")';
    const qb = this.guides
      .createQueryBuilder('g')
      .innerJoin('g.user', 'u')
      .select('g.id', 'id')
      .addSelect(fromPrice, 'from_price')
      .where('g.verificationStatus = :approved', { approved: GuideVerificationStatus.APPROVED })
      .andWhere('u.isActive = true');

    if (q.q) qb.andWhere('(u.fullName ILIKE :q OR g.bio ILIKE :q)', { q: `%${q.q}%` });
    if (q.language) qb.andWhere(':lang = ANY(g.languages)', { lang: q.language });
    if (q.minRating !== undefined) qb.andWhere('g.ratingAvg >= :minRating', { minRating: q.minRating });
    if (q.cityId) {
      qb.andWhere('EXISTS (SELECT 1 FROM guide_cities gc WHERE gc."guideId" = g.id AND gc."cityId" = :cityId)', {
        cityId: q.cityId,
      });
    }
    if (q.countryId) {
      qb.andWhere(
        `EXISTS (SELECT 1 FROM guide_cities gc JOIN cities c ON c.id = gc."cityId"
                 WHERE gc."guideId" = g.id AND c."countryId" = :countryId)`,
        { countryId: q.countryId },
      );
    }
    if (q.siteId) {
      qb.andWhere(
        `(EXISTS (SELECT 1 FROM guide_sites gs WHERE gs."guideId" = g.id AND gs."siteId" = :siteId)
          OR EXISTS (SELECT 1 FROM tour_packages p JOIN tour_package_sites ps ON ps."packageId" = p.id
                     WHERE p."guideId" = g.id AND p."isActive" AND ps."siteId" = :siteId))`,
        { siteId: q.siteId },
      );
    }
    if (q.maxPriceMinor !== undefined) {
      qb.andWhere(
        'EXISTS (SELECT 1 FROM tour_packages p WHERE p."guideId" = g.id AND p."isActive" AND p."priceMinor" <= :maxPrice)',
        { maxPrice: q.maxPriceMinor },
      );
    }
    if (q.date) {
      // Not on time off, and either no weekly hours configured or working that weekday.
      qb.andWhere(
        `NOT EXISTS (SELECT 1 FROM guide_time_off t WHERE t."guideId" = g.id AND CAST(:date AS date) BETWEEN t."startDate" AND t."endDate")
         AND (NOT EXISTS (SELECT 1 FROM guide_weekly_hours h WHERE h."guideId" = g.id)
              OR EXISTS (SELECT 1 FROM guide_weekly_hours h WHERE h."guideId" = g.id AND h.weekday = EXTRACT(DOW FROM CAST(:date AS date))))`,
        { date: q.date },
      );
      qb.andWhere(
        `NOT EXISTS (SELECT 1 FROM bookings b WHERE b."guideId" = g.id
                     AND b.status IN (:...busy) AND CAST(b."startAt" AT TIME ZONE 'UTC' AS date) = CAST(:date AS date))`,
        { busy: [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS], date: q.date },
      );
    }
    if (q.lat !== undefined && q.lng !== undefined) {
      qb.andWhere(
        `EXISTS (SELECT 1 FROM guide_cities gc JOIN cities c ON c.id = gc."cityId" WHERE gc."guideId" = g.id
                 AND ST_DWithin(c.location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radiusM))`,
        { lat: q.lat, lng: q.lng, radiusM: (q.radiusKm ?? 25) * 1000 },
      );
    }

    switch (q.sort ?? 'rating') {
      case 'price':
        qb.orderBy('from_price', 'ASC', 'NULLS LAST');
        break;
      case 'experience':
        qb.orderBy('g.yearsOfExperience', 'DESC');
        break;
      default:
        qb.orderBy('g.ratingAvg', 'DESC').addOrderBy('g.ratingCount', 'DESC');
    }
    qb.addOrderBy('g.id', 'ASC');

    const total = await qb.getCount();
    const rows: Array<{ id: string; from_price: number | null }> = await qb
      .offset((q.page - 1) * q.limit)
      .limit(q.limit)
      .getRawMany();

    const items = await this.loadPublic(rows.map((r) => r.id));
    return { items, total, page: q.page, limit: q.limit };
  }

  /** Loads guides by id (preserving order) and presents them publicly. */
  async loadPublic(ids: string[]): Promise<PublicGuide[]> {
    if (!ids.length) return [];
    const guides = await this.guides.find({
      where: { id: In(ids) },
      relations: { user: true, cities: { country: true }, licenseCountry: true },
    });
    const prices: Array<{ guideId: string; min: number; currency: string }> = await this.db.query(
      `SELECT DISTINCT ON ("guideId") "guideId", "priceMinor" AS min, currency
         FROM tour_packages WHERE "guideId" = ANY($1) AND "isActive"
         ORDER BY "guideId", "priceMinor" ASC`,
      [ids],
    );
    const byId = new Map(guides.map((g) => [g.id, g]));
    return ids
      .map((id) => byId.get(id))
      .filter((g): g is Guide => !!g)
      .map((g) => {
        const p = prices.find((x) => x.guideId === g.id);
        return presentGuide(g, { fromPriceMinor: p ? Number(p.min) : null, currency: p?.currency ?? null });
      });
  }

  // --------------------------------------------------------------- profile
  async publicProfile(id: string) {
    const [guide] = await this.loadPublicIfApproved(id);
    const packages = await this.db.getRepository(TourPackage).find({
      where: { guideId: id, isActive: true },
      relations: { sites: true, city: true },
      order: { priceMinor: 'ASC' },
    });
    const reviews = await this.db.getRepository(Review).find({
      where: { guideId: id, isHidden: false },
      relations: { author: true },
      order: { createdAt: 'DESC' },
      take: 20,
    });
    const g = await this.guides.findOne({ where: { id }, relations: { sites: true } });
    return {
      ...guide,
      sites: (g?.sites ?? []).map((s) => ({ id: s.id, name: s.name, category: s.category })),
      packages,
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        author: r.author?.fullName?.split(' ')[0] ?? 'Traveller',
      })),
    };
  }

  private async loadPublicIfApproved(id: string) {
    const exists = await this.guides.exists({ where: { id, verificationStatus: GuideVerificationStatus.APPROVED } });
    if (!exists) throw new NotFoundException('Guide not found');
    return this.loadPublic([id]);
  }

  // ------------------------------------------------------------ self-serve
  async getByUserId(userId: string): Promise<Guide> {
    const guide = await this.guides.findOne({
      where: { userId },
      relations: { user: true, cities: true, sites: true, licenseCountry: true },
    });
    if (!guide) throw new ForbiddenException('Guide profile required');
    return guide;
  }

  async findIdByUserId(userId: string): Promise<string | null> {
    const g = await this.guides.findOne({ where: { userId }, select: { id: true } });
    return g?.id ?? null;
  }

  async updateProfile(userId: string, dto: UpdateGuideProfileDto) {
    const guide = await this.getByUserId(userId);
    if (dto.bio !== undefined) guide.bio = dto.bio;
    if (dto.languages !== undefined) guide.languages = dto.languages;
    if (dto.yearsOfExperience !== undefined) guide.yearsOfExperience = dto.yearsOfExperience;
    if (dto.cityIds) guide.cities = await this.db.getRepository(City).findBy({ id: In(dto.cityIds) });
    if (dto.siteIds) guide.sites = await this.db.getRepository(Site).findBy({ id: In(dto.siteIds) });
    await this.guides.save(guide);
    return this.getByUserId(userId);
  }

  /** Submit (or resubmit) license details; runs KYC and enters the admin queue. */
  async submitApplication(userId: string, dto: SubmitApplicationDto) {
    const guide = await this.getByUserId(userId);
    assertCanSubmitApplication(guide.verificationStatus);

    const country = await this.db.getRepository(Country).findOneBy({ id: dto.licenseCountryId });
    if (!country) throw new NotFoundException('Country not found');

    const taken = await this.guides
      .createQueryBuilder('g')
      .where('g.licenseNumber = :n AND g.id <> :id', { n: dto.licenseNumber, id: guide.id })
      .getExists();
    if (taken) throw new ForbiddenException('This license number is already registered to another guide');

    let documentKey: string | null = null;
    if (dto.licenseDocumentKey) {
      // Only files this guide uploaded through license-upload are accepted.
      if (!dto.licenseDocumentKey.startsWith(`licenses/${guide.id}/`)) {
        throw new DomainError('INVALID_DOCUMENT', 'Upload the license scan with /guides/me/license-upload first');
      }
      if (!(await this.storage.stat(dto.licenseDocumentKey))) {
        throw new DomainError('DOCUMENT_NOT_UPLOADED', 'The license scan has not finished uploading');
      }
      documentKey = dto.licenseDocumentKey;
    }

    const check = await this.kyc.checkLicense({
      guideId: guide.id,
      fullName: guide.user.fullName,
      licenseNumber: dto.licenseNumber,
      licenseCountryCode: country.code,
      licenseExpiresAt: dto.licenseExpiresAt,
      documentUrl: documentKey ? await this.storage.createDownloadUrl(documentKey, 3600) : (dto.licenseDocumentUrl ?? null),
    });

    const from = guide.verificationStatus;
    await this.db.transaction(async (tx) => {
      await tx.getRepository(Guide).update(
        { id: guide.id },
        {
          licenseNumber: dto.licenseNumber,
          licenseCountryId: country.id,
          licenseExpiresAt: dto.licenseExpiresAt,
          licenseDocumentUrl: documentKey ? null : (dto.licenseDocumentUrl ?? null),
          licenseDocumentKey: documentKey,
          verificationStatus: GuideVerificationStatus.PENDING,
          submittedAt: new Date(),
          rejectionReason: null,
          kycStatus: KYC_MAP[check.status],
          kycReference: check.reference,
          kycResult: { provider: this.kyc.name, score: check.score, checks: check.checks },
        },
      );
      await tx.getRepository(GuideVerificationEvent).insert({
        guideId: guide.id,
        fromStatus: from,
        toStatus: GuideVerificationStatus.PENDING,
        actorId: userId,
        note: `Submitted license ${dto.licenseNumber} (KYC: ${check.status})`,
      });
    });
    return this.getByUserId(userId);
  }

  /** Signed URL for the app to PUT the license scan to private storage. */
  async createLicenseUpload(userId: string, dto: LicenseUploadDto) {
    const guide = await this.getByUserId(userId);
    const key = `licenses/${guide.id}/${randomUUID()}.${LICENSE_CONTENT_TYPES[dto.contentType]}`;
    return this.storage.createUpload({ key, contentType: dto.contentType, sizeBytes: dto.sizeBytes });
  }

  async dashboard(userId: string) {
    const guide = await this.getByUserId(userId);
    const bookings = this.db.getRepository(Booking);
    const now = new Date();

    const upcoming = await bookings
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.tourist', 't')
      .leftJoinAndSelect('b.package', 'p')
      .where('b.guideId = :id', { id: guide.id })
      .andWhere('b.status IN (:...s)', { s: [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS] })
      .andWhere('b.endAt >= :now', { now })
      .orderBy('b.startAt', 'ASC')
      .take(20)
      .getMany();

    const counts: Array<{ status: BookingStatus; count: string }> = await bookings
      .createQueryBuilder('b')
      .select('b.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('b.guideId = :id', { id: guide.id })
      .groupBy('b.status')
      .getRawMany();

    const earnings: Array<{ currency: string; releasedMinor: string; heldMinor: string }> = await this.db.query(
      `SELECT b.currency,
              COALESCE(SUM(b."guidePayoutMinor") FILTER (WHERE p."escrowStatus" = $2), 0) AS "releasedMinor",
              COALESCE(SUM(b."guidePayoutMinor") FILTER (WHERE p."escrowStatus" IN ($3, $4)), 0) AS "heldMinor"
         FROM bookings b JOIN payments p ON p."bookingId" = b.id
        WHERE b."guideId" = $1 GROUP BY b.currency`,
      [guide.id, EscrowStatus.RELEASED, EscrowStatus.HELD, EscrowStatus.DISPUTED],
    );

    return {
      guide: {
        id: guide.id,
        name: guide.user.fullName,
        verificationStatus: guide.verificationStatus,
        rejectionReason: guide.rejectionReason,
        ratingAvg: guide.ratingAvg,
        ratingCount: guide.ratingCount,
      },
      stats: Object.fromEntries(counts.map((c) => [c.status, Number(c.count)])),
      earnings: earnings.map((e) => ({
        currency: e.currency,
        releasedMinor: Number(e.releasedMinor),
        heldMinor: Number(e.heldMinor),
      })),
      upcoming: upcoming.map((b) => ({
        id: b.id,
        status: b.status,
        startAt: b.startAt,
        endAt: b.endAt,
        groupSize: b.groupSize,
        packageTitle: b.package?.title,
        touristName: b.tourist?.fullName,
        guidePayoutMinor: b.guidePayoutMinor,
        currency: b.currency,
      })),
    };
  }
}
