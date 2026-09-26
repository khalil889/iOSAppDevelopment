/**
 * Guide availability, framework-free so it can be unit tested.
 *
 * Weekly hours are wall-clock times in the timezone of the tour's city
 * (a guide in AlUla works "09:00–17:00 Asia/Riyadh"), so they stay correct
 * across DST changes. A guide with no weekly hours configured is treated as
 * available at any time, which keeps accounts created before this feature
 * bookable.
 */
import { DomainError } from '../common/errors/domain-error';
import { BookingStatus } from '../common/enums';
import { blocksCalendar, overlaps } from '../bookings/booking.rules';

export interface WeeklyWindow {
  /** 0 = Sunday … 6 = Saturday */
  weekday: number;
  /** Minutes since local midnight, [startMinute, endMinute) */
  startMinute: number;
  endMinute: number;
}

export interface TimeOff {
  /** Inclusive local dates, YYYY-MM-DD */
  startDate: string;
  endDate: string;
}

export interface LocalParts {
  date: string;
  weekday: number;
  minutes: number;
}

export const AVAILABILITY_LIMITS = { maxWindowsPerDay: 4, slotStepMinutes: 30 } as const;

const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/** Wall-clock date, weekday and minute-of-day of `instant` in `timeZone`. */
export function localParts(instant: Date, timeZone: string): LocalParts {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'short',
      hourCycle: 'h23',
    })
      .formatToParts(instant)
      .map((p) => [p.type, p.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    weekday: WEEKDAYS[parts.weekday],
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

/** The instant at which the wall clock in `timeZone` shows `date` + `minutes`. */
export function zonedToUtc(date: string, minutes: number, timeZone: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  const wall = Date.UTC(y, m - 1, d, 0, minutes);
  const offsetAt = (t: number) => {
    const p = localParts(new Date(t), timeZone);
    const [py, pm, pd] = p.date.split('-').map(Number);
    return Date.UTC(py, pm - 1, pd, 0, p.minutes) - Math.floor(t / 60_000) * 60_000;
  };
  let guess = wall - offsetAt(wall);
  guess = wall - offsetAt(guess); // second pass settles DST transitions
  return new Date(guess);
}

/** Weekday (0 = Sunday) of a YYYY-MM-DD calendar date. */
export function weekdayOf(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function isOnTimeOff(date: string, timeOff: TimeOff[]): boolean {
  return timeOff.some((t) => t.startDate <= date && date <= t.endDate);
}

/**
 * Whether a tour from `startAt` to `endAt` fits entirely inside one of the
 * guide's windows on its local day and doesn't touch a day off.
 */
export function isWithinAvailability(
  startAt: Date,
  endAt: Date,
  timeZone: string,
  hours: WeeklyWindow[],
  timeOff: TimeOff[],
): boolean {
  const start = localParts(startAt, timeZone);
  const end = localParts(endAt, timeZone);
  if (isOnTimeOff(start.date, timeOff) || isOnTimeOff(end.date, timeOff)) return false;
  if (!hours.length) return true;

  // Ending exactly at midnight counts as the end of the start day.
  const endMinute = end.date === start.date ? end.minutes : end.minutes === 0 && isNextDay(start.date, end.date) ? 1440 : -1;
  if (endMinute < 0) return false;
  return hours.some((w) => w.weekday === start.weekday && w.startMinute <= start.minutes && endMinute <= w.endMinute);
}

export function assertWithinAvailability(...args: Parameters<typeof isWithinAvailability>): void {
  if (!isWithinAvailability(...args)) {
    throw new DomainError('GUIDE_UNAVAILABLE', "The guide isn't available at that time. Pick one of the offered slots.");
  }
}

export interface Slot {
  startAt: Date;
  endAt: Date;
}

/**
 * Bookable start times on a local `date` for a tour of `durationMinutes`:
 * inside the guide's windows (or 08:00–20:00 when none are configured), not on
 * a day off, not clashing with calendar-blocking bookings, and at least
 * `minLeadMinutes` from now.
 */
export function freeSlots(opts: {
  date: string;
  timeZone: string;
  durationMinutes: number;
  hours: WeeklyWindow[];
  timeOff: TimeOff[];
  bookings: Array<Slot & { status: BookingStatus; paymentDueAt: Date | null }>;
  now: Date;
  minLeadMinutes: number;
  stepMinutes?: number;
}): Slot[] {
  const step = opts.stepMinutes ?? AVAILABILITY_LIMITS.slotStepMinutes;
  if (isOnTimeOff(opts.date, opts.timeOff)) return [];
  const weekday = weekdayOf(opts.date);
  const windows = opts.hours.length
    ? opts.hours.filter((w) => w.weekday === weekday)
    : [{ weekday, startMinute: 8 * 60, endMinute: 20 * 60 }];
  const earliest = opts.now.getTime() + opts.minLeadMinutes * 60_000;
  const busy = opts.bookings.filter((b) => blocksCalendar(b, opts.now));

  const slots: Slot[] = [];
  for (const w of [...windows].sort((a, b) => a.startMinute - b.startMinute)) {
    for (let m = w.startMinute; m + opts.durationMinutes <= w.endMinute; m += step) {
      const startAt = zonedToUtc(opts.date, m, opts.timeZone);
      const endAt = new Date(startAt.getTime() + opts.durationMinutes * 60_000);
      if (startAt.getTime() < earliest) continue;
      if (busy.some((b) => overlaps({ startAt, endAt }, b))) continue;
      if (!slots.some((s) => s.startAt.getTime() === startAt.getTime())) slots.push({ startAt, endAt });
    }
  }
  return slots;
}

/** Validates and normalises weekly hours submitted by a guide. */
export function validateWeeklyHours(windows: WeeklyWindow[]): WeeklyWindow[] {
  for (const w of windows) {
    if (!Number.isInteger(w.weekday) || w.weekday < 0 || w.weekday > 6) {
      throw new DomainError('INVALID_WEEKDAY', 'weekday must be 0 (Sunday) to 6 (Saturday)');
    }
    if (!Number.isInteger(w.startMinute) || !Number.isInteger(w.endMinute) || w.startMinute < 0 || w.endMinute > 1440) {
      throw new DomainError('INVALID_TIME', 'Times must be between 00:00 and 24:00');
    }
    if (w.startMinute >= w.endMinute) throw new DomainError('INVALID_WINDOW', 'Each window must end after it starts');
  }
  const sorted = [...windows].sort((a, b) => a.weekday - b.weekday || a.startMinute - b.startMinute);
  for (let i = 1; i < sorted.length; i++) {
    const [prev, cur] = [sorted[i - 1], sorted[i]];
    if (prev.weekday === cur.weekday && cur.startMinute < prev.endMinute) {
      throw new DomainError('OVERLAPPING_WINDOWS', 'Windows on the same day must not overlap');
    }
  }
  for (let d = 0; d < 7; d++) {
    if (sorted.filter((w) => w.weekday === d).length > AVAILABILITY_LIMITS.maxWindowsPerDay) {
      throw new DomainError('TOO_MANY_WINDOWS', `At most ${AVAILABILITY_LIMITS.maxWindowsPerDay} windows per day`);
    }
  }
  return sorted;
}

export function validateTimeOff(entries: TimeOff[], today: string): TimeOff[] {
  const re = /^\d{4}-\d{2}-\d{2}$/;
  for (const t of entries) {
    if (!re.test(t.startDate) || !re.test(t.endDate)) throw new DomainError('INVALID_DATE', 'Dates must be YYYY-MM-DD');
    if (t.endDate < t.startDate) throw new DomainError('INVALID_RANGE', 'Time off must end on or after its start date');
    if (t.endDate < today) throw new DomainError('PAST_TIME_OFF', 'Time off must not be entirely in the past');
  }
  return [...entries].sort((a, b) => a.startDate.localeCompare(b.startDate));
}

/** "09:30" ↔ 570 */
export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
export const toHHMM = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

function isNextDay(a: string, b: string): boolean {
  const [y, m, d] = a.split('-').map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
  return next === b;
}
