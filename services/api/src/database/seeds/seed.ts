/**
 * Resets the database content and loads demo data.
 *   npm run seed           (from services/api)
 * Uses DATABASE_URL; runs pending migrations first.
 */
import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import { BOOKING_RULES, bookingEnd, quotePrice } from '../../bookings/booking.rules';
import { geoPoint } from '../../common/base.entity';
import {
  BookingStatus,
  EscrowStatus,
  GuideVerificationStatus,
  KycStatus,
  UserRole,
} from '../../common/enums';
import { StubKycProvider } from '../../providers/kyc/stub-kyc.provider';
import { ratingAggregate } from '../../reviews/review.rules';
import dataSource from '../data-source';
import {
  Booking,
  City,
  Country,
  Dispute,
  GuideTimeOff,
  GuideWeeklyHours,
  SosAlert,
  Guide,
  GuideVerificationEvent,
  Payment,
  Review,
  Site,
  TourPackage,
  User,
} from '../entities';
import { ADMIN, CITIES, COUNTRIES, GUIDES, PASSWORDS, SITES, TIME_OFF, TOURISTS, WEEKLY_HOURS } from './seed-data';
import { toMinutes } from '../../availability/availability.rules';

const FEE = Number(process.env.PLATFORM_FEE_PERCENT ?? 15);
const HOUR = 3_600_000;
const img = (key: string) => `https://picsum.photos/seed/${key}/800/500`;

async function reset(ds: DataSource) {
  const tables = ds.entityMetadatas.map((m) => `"${m.tableName}"`).join(', ');
  await ds.query(`TRUNCATE ${tables} RESTART IDENTITY CASCADE`);
}

async function run() {
  const ds = await dataSource.initialize();
  await ds.runMigrations();
  await reset(ds);
  const now = new Date();

  // --- Geography ---------------------------------------------------------
  const countries = new Map<string, Country>();
  for (const c of COUNTRIES) countries.set(c.code, await ds.getRepository(Country).save(c));

  const cities = new Map<string, City>();
  for (const c of CITIES) {
    cities.set(
      c.key,
      await ds.getRepository(City).save({
        name: c.name,
        countryId: countries.get(c.country)!.id,
        location: geoPoint(c.lat, c.lng),
        timezone: c.tz,
      }),
    );
  }

  const sites = new Map<string, Site>();
  for (const s of SITES) {
    sites.set(
      s.key,
      await ds.getRepository(Site).save({
        name: s.name,
        description: s.description,
        category: s.category,
        cityId: cities.get(s.city)!.id,
        location: geoPoint(s.lat, s.lng),
        imageUrl: img(s.key),
        requiresLicensedGuide: !!s.licensed,
      }),
    );
  }

  // --- Users ---------------------------------------------------------------
  const hash = (p: string) => bcrypt.hash(p, 10);
  const defaultHash = await hash(PASSWORDS.default);
  const users = ds.getRepository(User);

  const admin = await users.save({
    ...ADMIN,
    fullName: ADMIN.name,
    role: UserRole.ADMIN,
    passwordHash: await hash(PASSWORDS.admin),
    phoneVerifiedAt: now,
  });

  const tourists = new Map<string, User>();
  for (const t of TOURISTS) {
    tourists.set(
      t.key,
      await users.save({
        email: t.email,
        phone: t.phone,
        fullName: t.name,
        role: UserRole.TOURIST,
        passwordHash: defaultHash,
        phoneVerifiedAt: now,
      }),
    );
  }

  // --- Guides & packages ----------------------------------------------------
  const kyc = new StubKycProvider();
  const guides = new Map<string, Guide>();
  const packages = new Map<string, TourPackage[]>();

  for (const g of GUIDES) {
    const user = await users.save({
      email: g.email,
      phone: g.phone,
      fullName: g.name,
      role: UserRole.GUIDE,
      passwordHash: defaultHash,
      phoneVerifiedAt: now,
      avatarUrl: `https://i.pravatar.cc/300?u=${g.key}`,
    });
    const country = countries.get(g.country)!;
    const check = await kyc.checkLicense({
      guideId: g.key,
      fullName: g.name,
      licenseNumber: g.license,
      licenseCountryCode: country.code,
      licenseExpiresAt: g.licenseExpires,
      documentUrl: `https://files.example.test/licenses/${g.key}.pdf`,
    });
    const submittedAt = new Date(now.getTime() - (g.status === 'PENDING' ? 20 : 400) * HOUR);
    const status = GuideVerificationStatus[g.status];

    const guide = await ds.getRepository(Guide).save({
      userId: user.id,
      bio: g.bio,
      languages: g.languages,
      yearsOfExperience: g.years,
      licenseNumber: g.license,
      licenseCountryId: country.id,
      licenseExpiresAt: g.licenseExpires,
      licenseDocumentUrl: `https://files.example.test/licenses/${g.key}.pdf`,
      verificationStatus: status,
      submittedAt,
      verifiedAt: g.status === 'APPROVED' ? new Date(submittedAt.getTime() + 24 * HOUR) : null,
      verifiedById: g.status === 'PENDING' ? null : admin.id,
      rejectionReason: g.rejectionReason ?? null,
      kycStatus: { clear: KycStatus.CLEAR, consider: KycStatus.CONSIDER, failed: KycStatus.FAILED }[check.status],
      kycReference: check.reference,
      kycResult: { provider: kyc.name, score: check.score, checks: check.checks },
      cities: g.cities.map((k) => cities.get(k)!),
      sites: g.sites.map((k) => sites.get(k)!),
    });
    guides.set(g.key, guide);

    const events: Partial<GuideVerificationEvent>[] = [
      { guideId: guide.id, fromStatus: GuideVerificationStatus.DRAFT, toStatus: GuideVerificationStatus.PENDING, actorId: user.id, note: `Submitted license ${g.license}`, createdAt: submittedAt },
    ];
    if (g.status !== 'PENDING') {
      events.push({ guideId: guide.id, fromStatus: GuideVerificationStatus.PENDING, toStatus: status, actorId: admin.id, note: g.rejectionReason ?? 'License verified against registry' });
    }
    await ds.getRepository(GuideVerificationEvent).save(events);

    const pkgs: TourPackage[] = [];
    for (const p of g.packages) {
      pkgs.push(
        await ds.getRepository(TourPackage).save({
          guideId: guide.id,
          cityId: cities.get(p.city)!.id,
          title: p.title,
          description: p.description,
          durationMinutes: p.durationMinutes,
          pricingType: p.pricingType,
          priceMinor: p.priceMinor,
          currency: country.currency,
          maxGroupSize: p.maxGroupSize,
          languages: g.languages,
          sites: p.sites.map((k) => sites.get(k)!),
        }),
      );
    }
    packages.set(g.key, pkgs);
  }

  // --- Availability ----------------------------------------------------------
  for (const [key, rules] of Object.entries(WEEKLY_HOURS)) {
    const guideId = guides.get(key)!.id;
    await ds.getRepository(GuideWeeklyHours).insert(
      rules.flatMap(([days, start, end]) =>
        days.map((weekday) => ({ guideId, weekday, startMinute: toMinutes(start), endMinute: toMinutes(end) })),
      ),
    );
  }
  for (const [key, from, to, reason] of TIME_OFF) {
    const day = (n: number) => new Date(now.getTime() + n * 86_400_000).toISOString().slice(0, 10);
    await ds.getRepository(GuideTimeOff).insert({ guideId: guides.get(key)!.id, startDate: day(from), endDate: day(to), reason });
  }

  // --- Bookings, payments, reviews -----------------------------------------
  const bookingRepo = ds.getRepository(Booking);
  const makeBooking = async (o: {
    tourist: string;
    guide: string;
    pkgIndex?: number;
    startInHours: number;
    groupSize: number;
    status: BookingStatus;
    escrow?: EscrowStatus;
  }) => {
    const pkg = packages.get(o.guide)![o.pkgIndex ?? 0];
    const startAt = new Date(now.getTime() + o.startInHours * HOUR);
    const endAt = bookingEnd(startAt, pkg.durationMinutes);
    const price = quotePrice(pkg, o.groupSize, FEE);
    const completed = o.status === BookingStatus.COMPLETED;
    const booking = await bookingRepo.save({
      touristId: tourists.get(o.tourist)!.id,
      guideId: guides.get(o.guide)!.id,
      packageId: pkg.id,
      status: o.status,
      startAt,
      endAt,
      groupSize: o.groupSize,
      ...price,
      paymentDueAt:
        o.status === BookingStatus.PENDING_PAYMENT
          ? new Date(now.getTime() + BOOKING_RULES.paymentWindowMinutes * 60_000)
          : null,
      startedAt: [BookingStatus.IN_PROGRESS, BookingStatus.COMPLETED].includes(o.status) ? startAt : null,
      completedAt: completed ? endAt : null,
    });
    if (o.escrow) {
      const released = o.escrow === EscrowStatus.RELEASED;
      await ds.getRepository(Payment).save({
        bookingId: booking.id,
        provider: 'stub',
        providerRef: `stub_pi_seed_${booking.id.slice(0, 8)}`,
        amountMinor: price.totalMinor,
        currency: price.currency,
        escrowStatus: o.escrow,
        heldAt: new Date(startAt.getTime() - 72 * HOUR),
        releaseAfter: completed ? new Date(endAt.getTime() + 7 * 24 * HOUR) : null,
        releasedAt: released ? new Date(endAt.getTime() + 7 * 24 * HOUR) : null,
        releasedMinor: released ? price.guidePayoutMinor : 0,
      });
    }
    return booking;
  };

  const reviews: Array<[Booking, number, string]> = [];
  // Past, released and reviewed
  reviews.push([await makeBooking({ tourist: 'lucas', guide: 'faisal', startInHours: -24 * 20, groupSize: 2, status: BookingStatus.COMPLETED, escrow: EscrowStatus.RELEASED }), 5, 'Faisal brought Diriyah to life. Worth every riyal.']);
  reviews.push([await makeBooking({ tourist: 'aisha', guide: 'faisal', pkgIndex: 1, startInHours: -24 * 12, groupSize: 3, status: BookingStatus.COMPLETED, escrow: EscrowStatus.RELEASED }), 4, 'Great walk, a bit hot at noon — go early!']);
  reviews.push([await makeBooking({ tourist: 'sara', guide: 'mona', startInHours: -24 * 15, groupSize: 2, status: BookingStatus.COMPLETED, escrow: EscrowStatus.RELEASED }), 5, 'Mona is a walking encyclopaedia of Egyptology.']);
  reviews.push([await makeBooking({ tourist: 'lucas', guide: 'noura', startInHours: -24 * 9, groupSize: 2, status: BookingStatus.COMPLETED, escrow: EscrowStatus.RELEASED }), 5, 'Hegra was magical. Noura explained everything in French for my parents.']);
  reviews.push([await makeBooking({ tourist: 'aisha', guide: 'yousef', startInHours: -24 * 30, groupSize: 4, status: BookingStatus.COMPLETED, escrow: EscrowStatus.RELEASED }), 4, 'The Monastery climb is tough but Yousef kept us going.']);

  // Sara: completed yesterday, escrow still held, NOT yet reviewed -> demo the review screen
  await makeBooking({ tourist: 'sara', guide: 'noura', pkgIndex: 1, startInHours: -26, groupSize: 2, status: BookingStatus.COMPLETED, escrow: EscrowStatus.HELD });
  // Sara: live tour right now -> demo live tour + SOS
  const live = await makeBooking({ tourist: 'sara', guide: 'faisal', startInHours: -0.5, groupSize: 2, status: BookingStatus.IN_PROGRESS, escrow: EscrowStatus.HELD });
  // Admin demo: an open SOS on the live tour ...
  await ds.getRepository(SosAlert).save({
    bookingId: live.id,
    raisedById: live.touristId,
    location: geoPoint(24.7339, 46.5755),
    message: 'Separated from the group near Salwa Palace, phone battery low',
    createdAt: new Date(now.getTime() - 4 * 60_000),
  });
  // ... and an open dispute on a completed tour (escrow frozen)
  const disputed = await makeBooking({ tourist: 'aisha', guide: 'omar', startInHours: -50, groupSize: 3, status: BookingStatus.COMPLETED, escrow: EscrowStatus.DISPUTED });
  await ds.getRepository(Dispute).save({
    bookingId: disputed.id,
    openedById: disputed.touristId,
    reason: 'NOT_AS_DESCRIBED',
    description: 'The tour was cut to 90 minutes and we skipped the street-food tastings that were advertised.',
  });
  // Sara: upcoming confirmed
  await makeBooking({ tourist: 'sara', guide: 'omar', startInHours: 24 * 3, groupSize: 2, status: BookingStatus.CONFIRMED, escrow: EscrowStatus.HELD });
  // Faisal: upcoming confirmed from Lucas (guide dashboard, can be started ~30 min before)
  await makeBooking({ tourist: 'lucas', guide: 'faisal', pkgIndex: 1, startInHours: 24 * 2, groupSize: 4, status: BookingStatus.CONFIRMED, escrow: EscrowStatus.HELD });
  // Cancelled example
  await makeBooking({ tourist: 'aisha', guide: 'mona', pkgIndex: 1, startInHours: 24 * 10, groupSize: 1, status: BookingStatus.CANCELLED });

  for (const [b, rating, comment] of reviews) {
    await ds.getRepository(Review).save({ bookingId: b.id, guideId: b.guideId, authorId: b.touristId, rating, comment });
  }
  for (const g of guides.values()) {
    const rs = reviews.filter(([b]) => b.guideId === g.id).map(([, r]) => r);
    await ds.getRepository(Guide).update({ id: g.id }, ratingAggregate(rs));
  }

  console.log('\nSeed complete.');
  console.log(`  Admin:   ${ADMIN.email} / ${PASSWORDS.admin}`);
  console.log(`  Tourist: ${TOURISTS[0].email} / ${PASSWORDS.default}  (live tour, review pending, upcoming booking)`);
  console.log(`  Guide:   ${GUIDES[0].email} / ${PASSWORDS.default}  (approved, dashboard data)`);
  console.log(`  Pending guides in verification queue: ${GUIDES.filter((g) => g.status === 'PENDING').length}`);
  await ds.destroy();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
