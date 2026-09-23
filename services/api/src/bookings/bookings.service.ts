import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, In } from 'typeorm';
import { geoPoint } from '../common/base.entity';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { BookingStatus, DisputeStatus, UserRole } from '../common/enums';
import { DomainError } from '../common/errors/domain-error';
import { Dispute } from '../disputes/dispute.entity';
import { Guide } from '../guides/guide.entity';
import { GuidesService } from '../guides/guides.service';
import { TourPackage } from '../packages/tour-package.entity';
import { PaymentsService } from '../payments/payments.service';
import { Review } from '../reviews/review.entity';
import { User } from '../users/user.entity';
import { Booking } from './booking.entity';
import {
  assertCanCreateBooking,
  assertNoConflict,
  BOOKING_RULES,
  BookingActor,
  bookingEnd,
  cancellationRefundPercent,
  isParticipant,
  nextStatus,
  quotePrice,
} from './booking.rules';
import { BookingListQuery, CancelBookingDto, CreateBookingDto, SosDto } from './dto';
import { SosAlert } from './sos-alert.entity';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private readonly db: DataSource,
    private readonly config: ConfigService,
    private readonly guides: GuidesService,
    private readonly payments: PaymentsService,
  ) {}

  private get feePercent() {
    return this.config.get<number>('marketplace.platformFeePercent')!;
  }

  async actor(user: AuthUser): Promise<BookingActor> {
    const guideId = user.role === UserRole.GUIDE ? await this.guides.findIdByUserId(user.id) : null;
    return { id: user.id, role: user.role, guideId };
  }

  // ------------------------------------------------------------- create
  async quote(user: AuthUser, dto: CreateBookingDto) {
    const { pkg } = await this.validateCandidate(user, dto);
    const startAt = new Date(dto.startAt);
    return {
      ...quotePrice(pkg, dto.groupSize, this.feePercent),
      startAt,
      endAt: bookingEnd(startAt, pkg.durationMinutes),
    };
  }

  private async validateCandidate(user: AuthUser, dto: CreateBookingDto) {
    const pkg = await this.db.getRepository(TourPackage).findOne({ where: { id: dto.packageId }, relations: { guide: true } });
    if (!pkg) throw new NotFoundException('Package not found');
    const tourist = await this.db.getRepository(User).findOneByOrFail({ id: user.id });
    assertCanCreateBooking({
      tourist,
      guide: pkg.guide,
      pkg,
      startAt: new Date(dto.startAt),
      groupSize: dto.groupSize,
      now: new Date(),
    });
    return { pkg, tourist };
  }

  async create(user: AuthUser, dto: CreateBookingDto) {
    const { pkg } = await this.validateCandidate(user, dto);
    const startAt = new Date(dto.startAt);
    const endAt = bookingEnd(startAt, pkg.durationMinutes);
    const price = quotePrice(pkg, dto.groupSize, this.feePercent);
    const now = new Date();

    const saved = await this.db.transaction(async (tx) => {
      // Serialise bookings per guide so two tourists can't grab the same slot.
      await tx.query('SELECT pg_advisory_xact_lock(hashtext($1))', [pkg.guideId]);
      const existing = await tx
        .getRepository(Booking)
        .createQueryBuilder('b')
        .where('b.guideId = :g', { g: pkg.guideId })
        .andWhere('b.status IN (:...s)', {
          s: [BookingStatus.PENDING_PAYMENT, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS],
        })
        .andWhere('b.startAt < :endAt AND b.endAt > :startAt', { startAt, endAt })
        .getMany();
      assertNoConflict({ startAt, endAt }, existing, now);

      return tx.getRepository(Booking).save(
        tx.getRepository(Booking).create({
          touristId: user.id,
          guideId: pkg.guideId,
          packageId: pkg.id,
          status: BookingStatus.PENDING_PAYMENT,
          startAt,
          endAt,
          groupSize: dto.groupSize,
          notes: dto.notes ?? null,
          paymentDueAt: new Date(now.getTime() + BOOKING_RULES.paymentWindowMinutes * 60_000),
          ...price,
        }),
      );
    });
    return this.get(user, saved.id);
  }

  // ------------------------------------------------------------ lifecycle
  async pay(user: AuthUser, id: string, token: string) {
    const booking = await this.load(id);
    const actor = await this.actor(user);
    const to = nextStatus(booking, 'pay', actor, new Date());

    const outcome = await this.payments.hold(booking, token);
    if (outcome.status === 'requires_action') {
      return { booking: await this.get(user, id), nextActionUrl: outcome.nextActionUrl };
    }
    await this.db.getRepository(Booking).update({ id }, { status: to, paymentDueAt: null });
    return { booking: await this.get(user, id) };
  }

  async start(user: AuthUser, id: string) {
    const booking = await this.load(id);
    const to = nextStatus(booking, 'start', await this.actor(user), new Date());
    await this.db.getRepository(Booking).update({ id }, { status: to, startedAt: new Date() });
    return this.get(user, id);
  }

  async complete(user: AuthUser, id: string) {
    const booking = await this.load(id);
    const now = new Date();
    const to = nextStatus(booking, 'complete', await this.actor(user), now);
    await this.db.transaction(async (tx) => {
      await tx.getRepository(Booking).update({ id }, { status: to, completedAt: now });
      await this.payments.scheduleRelease(id, now, tx);
    });
    return this.get(user, id);
  }

  async cancel(user: AuthUser, id: string, dto: CancelBookingDto) {
    const booking = await this.load(id);
    const actor = await this.actor(user);
    const now = new Date();
    const to = nextStatus(booking, 'cancel', actor, now);
    const refundPercent = cancellationRefundPercent(booking, actor, now);

    await this.db.getRepository(Booking).update(
      { id },
      { status: to, cancelledAt: now, cancelledById: user.id, cancellationReason: dto.reason ?? null, paymentDueAt: null },
    );
    await this.payments.settle(booking, refundPercent, `Cancelled: ${dto.reason ?? 'no reason given'}`);
    return { booking: await this.get(user, id), refundPercent };
  }

  async sos(user: AuthUser, id: string, dto: SosDto) {
    const booking = await this.load(id);
    const actor = await this.actor(user);
    if (!isParticipant(booking, actor)) {
      throw new DomainError('NOT_PARTICIPANT', 'You are not part of this booking', 'forbidden');
    }
    if (![BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS].includes(booking.status)) {
      throw new DomainError('TOUR_NOT_ACTIVE', 'SOS is only available for upcoming or live tours');
    }
    const alert = await this.db.getRepository(SosAlert).save({
      bookingId: id,
      raisedById: user.id,
      location: dto.lat !== undefined && dto.lng !== undefined ? geoPoint(dto.lat, dto.lng) : null,
      message: dto.message ?? null,
    });
    // Phase 1: log only. Hook a paging/notification provider here.
    this.logger.warn(`SOS ${alert.id} on booking ${id} by ${user.id} at ${JSON.stringify(alert.location?.coordinates ?? null)}`);
    return { id: alert.id, createdAt: alert.createdAt, status: 'RECEIVED', message: 'Our safety team has been alerted.' };
  }

  // ------------------------------------------------------------- queries
  async list(user: AuthUser, q: BookingListQuery) {
    const qb = this.db
      .getRepository(Booking)
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.package', 'p')
      .leftJoinAndSelect('p.city', 'city')
      .leftJoinAndSelect('b.guide', 'g')
      .leftJoinAndSelect('g.user', 'gu')
      .leftJoinAndSelect('b.tourist', 't')
      .leftJoinAndSelect('b.payment', 'pay')
      .orderBy('b.startAt', 'DESC');

    if (user.role === UserRole.TOURIST) qb.where('b.touristId = :id', { id: user.id });
    else if (user.role === UserRole.GUIDE) qb.where('b.guideId = :gid', { gid: await this.guides.findIdByUserId(user.id) });
    if (q.status) qb.andWhere('b.status = :status', { status: q.status });

    const [bookings, total] = await qb.skip((q.page - 1) * q.limit).take(q.limit).getManyAndCount();

    // Attach review / open-dispute markers so clients know which actions apply.
    const ids = bookings.map((b) => b.id);
    const [reviews, disputes] = ids.length
      ? await Promise.all([
          this.db.getRepository(Review).find({ where: { bookingId: In(ids) }, select: { id: true, bookingId: true, rating: true } }),
          this.db.getRepository(Dispute).find({
            where: { bookingId: In(ids), status: DisputeStatus.OPEN },
            select: { id: true, bookingId: true, status: true },
          }),
        ])
      : [[], []];
    const items = bookings.map((b) => ({
      ...b,
      review: reviews.find((r) => r.bookingId === b.id) ?? null,
      openDispute: disputes.find((d) => d.bookingId === b.id) ?? null,
    }));
    return { items, total, page: q.page, limit: q.limit };
  }

  async get(user: AuthUser, id: string) {
    const booking = await this.db.getRepository(Booking).findOne({
      where: { id },
      relations: { package: { sites: true, city: true }, guide: { user: true }, tourist: true, payment: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    const actor = await this.actor(user);
    if (!isParticipant(booking, actor) && user.role !== UserRole.ADMIN) throw new NotFoundException('Booking not found');

    const [review, openDispute] = await Promise.all([
      this.db.getRepository(Review).findOneBy({ bookingId: id }),
      this.db.getRepository(Dispute).findOneBy({ bookingId: id, status: In([DisputeStatus.OPEN]) }),
    ]);
    const { guide, tourist, ...rest } = booking;
    return {
      ...rest,
      guide: { id: guide.id, name: guide.user.fullName, phone: guide.user.phone, avatarUrl: guide.user.avatarUrl },
      tourist: { id: tourist.id, name: tourist.fullName, phone: tourist.phone },
      review,
      openDispute,
    };
  }

  async load(id: string): Promise<Booking> {
    const b = await this.db.getRepository(Booking).findOneBy({ id });
    if (!b) throw new NotFoundException('Booking not found');
    return b;
  }

  guideOf(booking: Booking) {
    return this.db.getRepository(Guide).findOneByOrFail({ id: booking.guideId });
  }
}
