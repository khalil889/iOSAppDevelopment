import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { Booking } from '../bookings/booking.entity';
import { BOOKING_RULES } from '../bookings/booking.rules';
import { BookingStatus, GuideVerificationStatus } from '../common/enums';
import { DomainError } from '../common/errors/domain-error';
import { TourPackage } from '../packages/tour-package.entity';
import { GuideTimeOff, GuideWeeklyHours } from './availability.entities';
import {
  assertWithinAvailability,
  freeSlots,
  localParts,
  TimeOff,
  toHHMM,
  toMinutes,
  validateTimeOff,
  validateWeeklyHours,
  WeeklyWindow,
} from './availability.rules';
import { SlotsQuery, UpdateAvailabilityDto } from './dto';

@Injectable()
export class AvailabilityService {
  constructor(private readonly db: DataSource) {}

  async load(guideId: string, em: EntityManager = this.db.manager): Promise<{ hours: WeeklyWindow[]; timeOff: TimeOff[] }> {
    const [hours, timeOff] = await Promise.all([
      em.getRepository(GuideWeeklyHours).find({ where: { guideId }, order: { weekday: 'ASC', startMinute: 'ASC' } }),
      em.getRepository(GuideTimeOff).find({ where: { guideId }, order: { startDate: 'ASC' } }),
    ]);
    return {
      hours: hours.map(({ weekday, startMinute, endMinute }) => ({ weekday, startMinute, endMinute })),
      timeOff: timeOff.map(({ startDate, endDate }) => ({ startDate, endDate })),
    };
  }

  /** The guide's own view, times as HH:MM. */
  async forGuide(guideId: string) {
    const [hours, timeOff] = await Promise.all([
      this.db.getRepository(GuideWeeklyHours).find({ where: { guideId }, order: { weekday: 'ASC', startMinute: 'ASC' } }),
      this.db.getRepository(GuideTimeOff).find({ where: { guideId }, order: { startDate: 'ASC' } }),
    ]);
    return {
      weeklyHours: hours.map((h) => ({ weekday: h.weekday, start: toHHMM(h.startMinute), end: toHHMM(h.endMinute) })),
      timeOff: timeOff.map((t) => ({ startDate: t.startDate, endDate: t.endDate, reason: t.reason })),
    };
  }

  /** Replaces the guide's weekly hours and time off. */
  async replace(guideId: string, dto: UpdateAvailabilityDto) {
    const hours = validateWeeklyHours(
      dto.weeklyHours.map((w) => ({ weekday: w.weekday, startMinute: toMinutes(w.start), endMinute: toMinutes(w.end) })),
    );
    const today = new Date().toISOString().slice(0, 10);
    validateTimeOff(dto.timeOff, today);

    await this.db.transaction(async (tx) => {
      await tx.getRepository(GuideWeeklyHours).delete({ guideId });
      await tx.getRepository(GuideTimeOff).delete({ guideId });
      if (hours.length) await tx.getRepository(GuideWeeklyHours).insert(hours.map((h) => ({ ...h, guideId })));
      if (dto.timeOff.length) {
        await tx
          .getRepository(GuideTimeOff)
          .insert(dto.timeOff.map((t) => ({ guideId, startDate: t.startDate, endDate: t.endDate, reason: t.reason ?? null })));
      }
    });
    return this.forGuide(guideId);
  }

  /** Throws GUIDE_UNAVAILABLE unless the tour fits the guide's hours in the city's timezone. */
  async assertBookable(guideId: string, timeZone: string, startAt: Date, endAt: Date, em?: EntityManager) {
    const { hours, timeOff } = await this.load(guideId, em);
    assertWithinAvailability(startAt, endAt, timeZone, hours, timeOff);
  }

  /** Free start times for a package on a local date in its city. */
  async slots(q: SlotsQuery, now = new Date()) {
    const pkg = await this.db.getRepository(TourPackage).findOne({
      where: { id: q.packageId, isActive: true, guide: { verificationStatus: GuideVerificationStatus.APPROVED } },
      relations: { city: true },
    });
    if (!pkg) throw new NotFoundException('Package not found');
    const timeZone = pkg.city.timezone;
    const today = localParts(now, timeZone).date;
    if (q.date < today) throw new DomainError('DATE_IN_PAST', 'Pick today or a future date');

    const { hours, timeOff } = await this.load(pkg.guideId);
    const dayStart = new Date(`${q.date}T00:00:00Z`).getTime();
    const bookings = await this.db
      .getRepository(Booking)
      .createQueryBuilder('b')
      .where('b.guideId = :g', { g: pkg.guideId })
      .andWhere('b.status IN (:...s)', { s: [BookingStatus.PENDING_PAYMENT, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS] })
      // ±1 day around the date covers every timezone offset
      .andWhere('b.startAt < :to AND b.endAt > :from', { from: new Date(dayStart - 86_400_000), to: new Date(dayStart + 2 * 86_400_000) })
      .getMany();

    const slots = freeSlots({
      date: q.date,
      timeZone,
      durationMinutes: pkg.durationMinutes,
      hours,
      timeOff,
      bookings,
      now,
      minLeadMinutes: BOOKING_RULES.minLeadTimeMinutes,
    });
    return {
      date: q.date,
      timeZone,
      durationMinutes: pkg.durationMinutes,
      slots: slots.map((s) => ({ startAt: s.startAt, endAt: s.endAt, localTime: toHHMM(localParts(s.startAt, timeZone).minutes) })),
    };
  }
}
