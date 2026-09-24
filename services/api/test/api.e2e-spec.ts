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
