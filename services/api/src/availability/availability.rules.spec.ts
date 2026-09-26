import { BookingStatus } from '../common/enums';
import { DomainError } from '../common/errors/domain-error';
import {
  freeSlots,
  isWithinAvailability,
  localParts,
  toHHMM,
  toMinutes,
  validateTimeOff,
  validateWeeklyHours,
  WeeklyWindow,
  weekdayOf,
  zonedToUtc,
} from './availability.rules';

const RIYADH = 'Asia/Riyadh'; // UTC+3, no DST
const CAIRO = 'Africa/Cairo'; // DST in summer
const code = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    return (e as DomainError).code;
  }
  return null;
};

// Sunday–Thursday 09:00–17:00
const workweek: WeeklyWindow[] = [0, 1, 2, 3, 4].map((weekday) => ({ weekday, startMinute: 540, endMinute: 1020 }));

describe('timezone helpers', () => {
  it('converts wall-clock time in Riyadh to UTC and back', () => {
    const t = zonedToUtc('2026-10-04', 9 * 60, RIYADH);
    expect(t.toISOString()).toBe('2026-10-04T06:00:00.000Z');
    expect(localParts(t, RIYADH)).toEqual({ date: '2026-10-04', weekday: 0, minutes: 540 });
  });

  it('handles DST: 10:00 in Cairo is UTC+3 in summer and UTC+2 in winter', () => {
    expect(zonedToUtc('2026-07-15', 600, CAIRO).toISOString()).toBe('2026-07-15T07:00:00.000Z');
    expect(zonedToUtc('2026-12-15', 600, CAIRO).toISOString()).toBe('2026-12-15T08:00:00.000Z');
  });

  it('computes weekdays for calendar dates', () => {
    expect(weekdayOf('2026-10-04')).toBe(0); // Sunday
    expect(weekdayOf('2026-10-09')).toBe(5); // Friday
  });

  it('formats and parses HH:MM', () => {
    expect(toMinutes('09:30')).toBe(570);
    expect(toHHMM(570)).toBe('09:30');
    expect(toHHMM(1440)).toBe('24:00');
  });
});

describe('isWithinAvailability', () => {
  const at = (date: string, hhmm: string, minutes: number) => {
    const start = zonedToUtc(date, toMinutes(hhmm), RIYADH);
    return [start, new Date(start.getTime() + minutes * 60_000)] as const;
  };

  it('accepts a tour fully inside a window', () => {
    expect(isWithinAvailability(...at('2026-10-04', '09:00', 180), RIYADH, workweek, [])).toBe(true);
    expect(isWithinAvailability(...at('2026-10-04', '14:00', 180), RIYADH, workweek, [])).toBe(true);
  });

  it('rejects tours that start early, run late, or fall on a day off', () => {
    expect(isWithinAvailability(...at('2026-10-04', '08:30', 60), RIYADH, workweek, [])).toBe(false);
    expect(isWithinAvailability(...at('2026-10-04', '15:00', 180), RIYADH, workweek, [])).toBe(false);
    expect(isWithinAvailability(...at('2026-10-09', '10:00', 60), RIYADH, workweek, [])).toBe(false); // Friday
  });

  it('rejects dates inside time off', () => {
    const off = [{ startDate: '2026-10-04', endDate: '2026-10-06' }];
    expect(isWithinAvailability(...at('2026-10-05', '10:00', 60), RIYADH, workweek, off)).toBe(false);
    expect(isWithinAvailability(...at('2026-10-07', '10:00', 60), RIYADH, workweek, off)).toBe(true);
  });

  it('treats guides without weekly hours as always available (except time off)', () => {
    expect(isWithinAvailability(...at('2026-10-09', '23:00', 60), RIYADH, [], [])).toBe(true);
    expect(isWithinAvailability(...at('2026-10-09', '10:00', 60), RIYADH, [], [{ startDate: '2026-10-09', endDate: '2026-10-09' }])).toBe(false);
  });

  it('allows a tour ending exactly at midnight but not one crossing it', () => {
    const late: WeeklyWindow[] = [{ weekday: 0, startMinute: 1200, endMinute: 1440 }];
    expect(isWithinAvailability(...at('2026-10-04', '22:00', 120), RIYADH, late, [])).toBe(true);
    expect(isWithinAvailability(...at('2026-10-04', '23:00', 120), RIYADH, late, [])).toBe(false);
  });
});

describe('freeSlots', () => {
  const now = new Date('2026-10-01T00:00:00Z');
  const base = { timeZone: RIYADH, durationMinutes: 180, hours: workweek, timeOff: [], bookings: [], now, minLeadMinutes: 120 };

  it('lists 30-minute steps that fit the window', () => {
    const slots = freeSlots({ ...base, date: '2026-10-04' });
    expect(slots.map((s) => localParts(s.startAt, RIYADH).minutes).map(toHHMM)).toEqual([
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00',
    ]);
  });

  it('removes slots overlapping a confirmed booking but keeps back-to-back ones', () => {
    const b = { startAt: zonedToUtc('2026-10-04', 660, RIYADH), endAt: zonedToUtc('2026-10-04', 780, RIYADH) }; // 11:00–13:00
    const slots = freeSlots({ ...base, date: '2026-10-04', bookings: [{ ...b, status: BookingStatus.CONFIRMED, paymentDueAt: null }] });
    expect(slots.map((s) => toHHMM(localParts(s.startAt, RIYADH).minutes))).toEqual(['13:00', '13:30', '14:00']);
  });

  it('ignores cancelled bookings and lapsed payment holds', () => {
    const b = { startAt: zonedToUtc('2026-10-04', 540, RIYADH), endAt: zonedToUtc('2026-10-04', 1020, RIYADH) };
    const slots = freeSlots({
      ...base,
      date: '2026-10-04',
      bookings: [
        { ...b, status: BookingStatus.CANCELLED, paymentDueAt: null },
        { ...b, status: BookingStatus.PENDING_PAYMENT, paymentDueAt: new Date(now.getTime() - 1) },
      ],
    });
    expect(slots).toHaveLength(11);
  });

  it('returns nothing on non-working days and time off, and respects lead time', () => {
    expect(freeSlots({ ...base, date: '2026-10-09' })).toEqual([]);
    expect(freeSlots({ ...base, date: '2026-10-04', timeOff: [{ startDate: '2026-10-04', endDate: '2026-10-04' }] })).toEqual([]);
    const soon = freeSlots({ ...base, date: '2026-10-04', now: zonedToUtc('2026-10-04', 600, RIYADH) }); // now 10:00, lead 2h
    expect(toHHMM(localParts(soon[0].startAt, RIYADH).minutes)).toBe('12:00');
  });

  it('offers 08:00–20:00 when the guide has not set hours', () => {
    const slots = freeSlots({ ...base, hours: [], date: '2026-10-09', durationMinutes: 60 });
    expect(toHHMM(localParts(slots[0].startAt, RIYADH).minutes)).toBe('08:00');
    expect(toHHMM(localParts(slots[slots.length - 1].startAt, RIYADH).minutes)).toBe('19:00');
  });
});

describe('validation', () => {
  it('accepts and sorts valid weekly hours', () => {
    expect(
      validateWeeklyHours([
        { weekday: 1, startMinute: 780, endMinute: 1020 },
        { weekday: 1, startMinute: 480, endMinute: 720 },
      ]).map((w) => w.startMinute),
    ).toEqual([480, 780]);
  });

  it('rejects bad weekdays, times, empty and overlapping windows', () => {
    expect(code(() => validateWeeklyHours([{ weekday: 7, startMinute: 0, endMinute: 60 }]))).toBe('INVALID_WEEKDAY');
    expect(code(() => validateWeeklyHours([{ weekday: 1, startMinute: 0, endMinute: 1500 }]))).toBe('INVALID_TIME');
    expect(code(() => validateWeeklyHours([{ weekday: 1, startMinute: 600, endMinute: 600 }]))).toBe('INVALID_WINDOW');
    expect(
      code(() =>
        validateWeeklyHours([
          { weekday: 1, startMinute: 480, endMinute: 720 },
          { weekday: 1, startMinute: 700, endMinute: 900 },
        ]),
      ),
    ).toBe('OVERLAPPING_WINDOWS');
    expect(
      code(() => validateWeeklyHours([0, 1, 2, 3, 4].map((i) => ({ weekday: 2, startMinute: i * 100, endMinute: i * 100 + 50 })))),
    ).toBe('TOO_MANY_WINDOWS');
  });

  it('validates time off ranges', () => {
    expect(validateTimeOff([{ startDate: '2026-12-01', endDate: '2026-12-03' }], '2026-10-01')).toHaveLength(1);
    expect(code(() => validateTimeOff([{ startDate: '2026-12-03', endDate: '2026-12-01' }], '2026-10-01'))).toBe('INVALID_RANGE');
    expect(code(() => validateTimeOff([{ startDate: '2026-01-01', endDate: '2026-01-02' }], '2026-10-01'))).toBe('PAST_TIME_OFF');
    expect(code(() => validateTimeOff([{ startDate: '2026/12/01', endDate: '2026-12-02' }], '2026-10-01'))).toBe('INVALID_DATE');
  });
});
