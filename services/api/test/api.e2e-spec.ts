/**
 * End-to-end checks against a real Postgres/PostGIS database with the seed
 * loaded (`npm run migration:run && npm run seed`). Covers the SQL paths unit
 * tests can't: search filters, availability slots and booking enforcement.
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { DomainErrorFilter } from '../src/common/errors/domain-error.filter';

let app: INestApplication;
let base: string;

async function call<T = any>(method: string, path: string, body?: unknown, token?: string): Promise<{ status: number; body: T }> {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: (await res.json()) as T };
}

const login = async (email: string) =>
  (await call<{ accessToken: string }>('POST', '/auth/login', { email, password: 'Password123!' })).body.accessToken;

/** Next calendar date (at least 3 days out) falling on `weekday` (0 = Sunday). */
function nextWeekday(weekday: number): string {
  const d = new Date(Date.now() + 3 * 86_400_000);
  while (d.getUTCDay() !== weekday) d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

beforeAll(async () => {
  process.env.DB_RUN_MIGRATIONS = 'false';
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  app.useGlobalFilters(new DomainErrorFilter());
  await app.listen(0);
  base = `${await app.getUrl()}/api`.replace('[::1]', 'localhost');
});

afterAll(async () => {
  await app?.close();
});

describe('guide search', () => {
  it('returns only verified guides', async () => {
    const { status, body } = await call('GET', '/guides?limit=50');
    expect(status).toBe(200);
    const names = body.items.map((g: { name: string }) => g.name);
    expect(names).toEqual(expect.arrayContaining(['Faisal Al-Harbi', 'Mona Hassan']));
    expect(names).not.toContain('Khalid Al-Otaibi'); // pending
    expect(names).not.toContain('Sami Haddad'); // rejected
  });

  it('filters by date using weekly hours (Friday: only guides who work Fridays)', async () => {
    const { status, body } = await call('GET', `/guides?date=${nextWeekday(5)}`);
    expect(status).toBe(200);
    expect(body.items.map((g: { name: string }) => g.name)).toEqual(['Yousef Nasser']);
  });

  it('combines language, rating and radius filters', async () => {
    const { status, body } = await call('GET', '/guides?language=fr&minRating=4&lat=26.6&lng=37.9&radiusKm=50');
    expect(status).toBe(200);
    expect(body.items.map((g: { name: string }) => g.name)).toEqual(['Noura Al-Qahtani']);
  });
});

describe('site search', () => {
  it('sorts by distance within a radius', async () => {
    const { body } = await call('GET', '/sites?lat=24.71&lng=46.67&radiusKm=30');
    const km = body.items.map((s: { distanceKm: number }) => s.distanceKm);
    expect(km.length).toBeGreaterThan(0);
    expect([...km].sort((a, b) => a - b)).toEqual(km);
  });
});

describe('availability and booking', () => {
  let packageId: string;
  let tourist: string;

  beforeAll(async () => {
    const guides = await call('GET', '/guides?q=Noura');
    const profile = await call('GET', `/guides/${guides.body.items[0].id}`);
    packageId = profile.body.packages[0].id;
    tourist = await login('aisha@example.com');
  });

  it('offers slots on working days and none on the day off', async () => {
    const sunday = await call('GET', `/availability/slots?packageId=${packageId}&date=${nextWeekday(0)}`);
    expect(sunday.status).toBe(200);
    expect(sunday.body.timeZone).toBe('Asia/Riyadh');
    expect(sunday.body.slots[0].localTime).toBe('07:00');
    const friday = await call('GET', `/availability/slots?packageId=${packageId}&date=${nextWeekday(5)}`);
    expect(friday.body.slots).toEqual([]);
  });

  it('rejects a booking outside the guide’s hours and accepts one inside', async () => {
    const outside = await call(
      'POST',
      '/bookings/quote',
      { packageId, startAt: `${nextWeekday(5)}T07:00:00Z`, groupSize: 2 },
      tourist,
    );
    expect(outside.status).toBe(422);
    expect((outside.body as { error: string }).error).toBe('GUIDE_UNAVAILABLE');

    const slots = await call('GET', `/availability/slots?packageId=${packageId}&date=${nextWeekday(1)}`);
    const inside = await call('POST', '/bookings/quote', { packageId, startAt: slots.body.slots[0].startAt, groupSize: 2 }, tourist);
    expect(inside.status).toBe(200);
    expect(inside.body.totalMinor).toBeGreaterThan(0);
  });
});

describe('notifications', () => {
  it('registers a device, notifies both sides of a paid booking, and marks read', async () => {
    const tourist = await login('lucas@example.com');
    const guide = await login('noura@guides.test');
    const reg = await call('POST', '/me/devices', { token: 'fcm-token-e2e-0123456789abcdef', platform: 'android' }, guide);
    expect(reg.body).toEqual({ registered: true });

    const guides = await call('GET', '/guides?q=Noura');
    const profile = await call('GET', `/guides/${guides.body.items[0].id}`);
    const pkg = profile.body.packages[0];
    const slots = await call('GET', `/availability/slots?packageId=${pkg.id}&date=${nextWeekday(2)}`);
    const booking = await call('POST', '/bookings', { packageId: pkg.id, startAt: slots.body.slots[2].startAt, groupSize: 1 }, tourist);
    expect(booking.status).toBe(201);
    const paid = await call('POST', `/bookings/${booking.body.id}/pay`, { paymentMethodToken: 'tok_ok' }, tourist);
    expect(paid.body.booking.status).toBe('CONFIRMED');

    const guideInbox = await call('GET', '/me/notifications', undefined, guide);
    expect(guideInbox.body.items[0]).toMatchObject({ type: 'NEW_BOOKING', title: 'New booking', data: { bookingId: booking.body.id } });
    expect(guideInbox.body.unread).toBeGreaterThan(0);
    const touristInbox = await call('GET', '/me/notifications', undefined, tourist);
    expect(touristInbox.body.items[0]).toMatchObject({ type: 'BOOKING_CONFIRMED' });
    expect(touristInbox.body.items[0].body).toMatch(/Noura/);

    // Cancelling notifies the guide
    await call('POST', `/bookings/${booking.body.id}/cancel`, { reason: 'e2e' }, tourist);
    const after = await call('GET', '/me/notifications', undefined, guide);
    expect(after.body.items[0].type).toBe('BOOKING_CANCELLED');

    const read = await call('POST', '/me/notifications/read', {}, guide);
    expect(read.body.updated).toBeGreaterThan(0);
    expect((await call('GET', '/me/notifications', undefined, guide)).body.unread).toBe(0);
    await call('POST', '/me/devices/unregister', { token: 'fcm-token-e2e-0123456789abcdef' }, guide);
  });

  it('sends a review reminder once for a tour completed yesterday', async () => {
    const { NotificationsService } = await import('../src/notifications/notifications.service');
    const svc = app.get(NotificationsService);
    await svc.sendReviewReminders(); // Sara's AlUla tour from the seed qualifies
    expect(await svc.sendReviewReminders()).toBe(0); // never twice
    const sara = await login('sara@example.com');
    const inbox = await call('GET', '/me/notifications', undefined, sara);
    expect(inbox.body.items.some((n: { type: string }) => n.type === 'REVIEW_REMINDER')).toBe(true);
  });
});
