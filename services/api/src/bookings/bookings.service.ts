import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, In } from 'typeorm';
import { geoPoint } from '../common/base.entity';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { BookingStatus, DisputeStatus, UserRole } from '../common/enums';
import { DomainError } from '../common/errors/domain-error';
import { AvailabilityService } from '../availability/availability.service';
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
  isTourist,
  nextStatus,
  quotePrice,
} from './booking.rules';
import { BookingListQuery, CancelBookingDto, CreateBookingDto, SosDto } from './dto';
import { SosAlert } from './sos-alert.entity';
import { SosNotifier } from './sos-notifier';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private readonly db: DataSource,
    private readonly config: ConfigService,
    private readonly guides: GuidesService,
    private readonly payments: PaymentsService,
    private readonly availability: AvailabilityService,
    private readonly sosNotifier: SosNotifier,
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
    const pkg = await this.db.getRepository(TourPackage).findOne({ where: { id: dto.packageId }, relations: { guide: true, city: true } });
    if (!pkg) throw new NotFoundException('Package not found');
    const tourist = await this.db.getRepository(User).findOneByOrFail({ id: user.id });
    const startAt = new Date(dto.startAt);
    assertCanCreateBooking({
      tourist,
      guide: pkg.guide,
      pkg,
      startAt,
      groupSize: dto.groupSize,
      now: new Date(),
    });
    await this.availability.assertBookable(pkg.guideId, pkg.city.timezone, startAt, bookingEnd(startAt, pkg.durationMinutes));
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
    const now = new Date();
    // A lapsed payment window only matters if someone else took the slot
    // meanwhile; that is checked once the money is secured (see settleLatePayment).
    const lapsed = !!booking.paymentDueAt && booking.paymentDueAt <= now;
    nextStatus({ ...booking, paymentDueAt: lapsed ? null : booking.paymentDueAt }, 'pay', actor, now);

    const outcome = await this.payments.hold(booking, token);
    if (outcome.status === 'requires_action') {
      return { booking: await this.get(user, id), nextActionUrl: outcome.nextActionUrl };
    }
    await this.confirmPaid(booking);
    return { booking: await this.get(user, id) };
  }

  /**
   * Called by the app after 3-D Secure, and by the gateway webhook: re-checks
   * the pending payment and confirms the booking once funds are held.
   */
  async confirmPayment(user: AuthUser | null, id: string) {
    const booking = await this.load(id);
    if (user && user.id !== booking.touristId) {
      throw new DomainError('NOT_BOOKING_OWNER', 'Only the tourist can pay for this booking', 'forbidden');
    }
    if (booking.status === BookingStatus.PENDING_PAYMENT) {
      const outcome = await this.payments.verifyPending(booking);
      if (outcome?.status === 'held') await this.confirmPaid(booking);
    }
    return user ? { booking: await this.get(user, id) } : null;
  }

  private async confirmPaid(booking: Booking) {
    const now = new Date();
    if (booking.paymentDueAt && booking.paymentDueAt <= now) {
      await this.settleLatePayment(booking, now);
    }
    await this.db
      .getRepository(Booking)
      .update({ id: booking.id, status: BookingStatus.PENDING_PAYMENT }, { status: BookingStatus.CONFIRMED, paymentDueAt: null });
  }

  /** Payment arrived after the hold lapsed: keep it if the slot is still free, otherwise refund. */
  private async settleLatePayment(booking: Booking, now: Date) {
    const clash = await this.db
      .getRepository(Booking)
      .createQueryBuilder('b')
      .where('b.guideId = :g AND b.id <> :id', { g: booking.guideId, id: booking.id })
      .andWhere('b.status IN (:...s)', {
        s: [BookingStatus.PENDING_PAYMENT, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS],
      })
      .andWhere('b.startAt < :endAt AND b.endAt > :startAt', { startAt: booking.startAt, endAt: booking.endAt })
      .getMany();
    try {
      assertNoConflict(booking, clash, now);
    } catch (e) {
      await this.payments.settle(booking, 100, 'Slot taken before payment completed');
      await this.db.getRepository(Booking).update(
        { id: booking.id },
        { status: BookingStatus.CANCELLED, cancelledAt: now, cancellationReason: 'Payment completed after the slot was taken; refunded', paymentDueAt: null },
      );
      throw new DomainError('SLOT_UNAVAILABLE', 'This time slot was taken while your payment was processing. You have been refunded in full.', 'conflict');
    }
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
    this.logger.warn(`SOS ${alert.id} on booking ${id} by ${user.id} at ${JSON.stringify(alert.location?.coordinates ?? null)}`);

    const full = await this.db.getRepository(Booking).findOneOrFail({
      where: { id },
      relations: { tourist: true, guide: { user: true }, package: { city: true } },
    });
    const paged = await this.sosNotifier.notifyOps({
      alertId: alert.id,
      raisedBy: isTourist(booking, actor) ? 'tourist' : 'guide',
      touristName: full.tourist.fullName,
      touristPhone: full.tourist.phone,
      guideName: full.guide.user.fullName,
      guidePhone: full.guide.user.phone,
      packageTitle: full.package.title,
      city: full.package.city?.name ?? null,
      lat: dto.lat,
      lng: dto.lng,
      message: dto.message,
    });
    return {
      id: alert.id,
      createdAt: alert.createdAt,
      status: 'RECEIVED',
      opsPaged: paged.sent > 0,
      message: 'Our safety team has been alerted.',
    };
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
