/**
 * End-to-end checks against a real Postgres/PostGIS database with the seed
 * loaded (`npm run migration:run && npm run seed`). Covers the SQL paths unit
 * tests can't: search filters, availability slots and booking enforcement.
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';

let app: INestApplication;
let base: string;

async function call<T = any>(
  method: string,
  path: string,
  body?: unknown,
  token?: string,
  headers: Record<string, string> = {},
): Promise<{ status: number; body: T }> {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers },
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

describe('sessions', () => {
  const signIn = (email: string, password = 'Password123!') =>
    call<{ accessToken: string; refreshToken: string; expiresIn: number; statusCode?: number }>('POST', '/auth/login', { email, password });

  it('rotates refresh tokens and revokes the family when an old one is replayed', async () => {
    const first = (await signIn('mona@guides.test')).body;
    expect(first.expiresIn).toBe(900);
    const second = await call('POST', '/auth/refresh', { refreshToken: first.refreshToken });
    expect(second.status).toBe(200);
    expect(second.body.refreshToken).not.toBe(first.refreshToken);

    expect((await call('POST', '/auth/refresh', { refreshToken: first.refreshToken })).status).toBe(401); // replay
    expect((await call('POST', '/auth/refresh', { refreshToken: second.body.refreshToken })).status).toBe(401); // family revoked
  });

  it('logout-all ends every session of the user', async () => {
    const a = (await signIn('yousef@guides.test')).body;
    const b = (await signIn('yousef@guides.test')).body;
    expect((await call('POST', '/auth/logout-all', {}, a.accessToken)).body.sessions).toBeGreaterThanOrEqual(2);
    expect((await call('POST', '/auth/refresh', { refreshToken: b.refreshToken })).status).toBe(401);
  });

  it('locks password login after repeated failures; a phone code clears it', async () => {
    for (let i = 0; i < 5; i++) expect((await signIn('omar@guides.test', 'wrong-password')).status).toBe(401);
    expect((await signIn('omar@guides.test')).status).toBe(429);

    const sent = await call<{ devCode?: string }>('POST', '/auth/otp/request', { phone: '+966500000103', purpose: 'LOGIN' });
    if (sent.body.devCode) {
      const verified = await call('POST', '/auth/otp/verify', { phone: '+966500000103', purpose: 'LOGIN', code: sent.body.devCode });
      expect(verified.status).toBe(200);
      expect((await signIn('omar@guides.test')).status).toBe(200);
    }
  });
});

describe('hardening', () => {
  it('lets only one of two concurrent cancels through and refunds once', async () => {
    const { DataSource } = await import('typeorm');
    const tourist = await login('aisha@example.com');
    const guides = await call('GET', '/guides?q=Noura');
    const profile = await call('GET', `/guides/${guides.body.items[0].id}`);
    const pkg = profile.body.packages[0];
    const slots = await call('GET', `/availability/slots?packageId=${pkg.id}&date=${nextWeekday(3)}`);
    const booking = await call('POST', '/bookings', { packageId: pkg.id, startAt: slots.body.slots[1].startAt, groupSize: 1 }, tourist);
    await call('POST', `/bookings/${booking.body.id}/pay`, { paymentMethodToken: 'tok_ok' }, tourist);

    const results = await Promise.all([1, 2].map(() => call('POST', `/bookings/${booking.body.id}/cancel`, { reason: 'race' }, tourist)));
    expect(results.filter((r) => r.status < 300)).toHaveLength(1);

    const rows = await app
      .get(DataSource)
      .query(`SELECT "escrowStatus", "refundedMinor" FROM payments WHERE "bookingId" = $1`, [booking.body.id]);
    expect(rows).toHaveLength(1);
    expect(rows[0].escrowStatus).toBe('REFUNDED');
  });

  it('never signs admins in with a phone code alone', async () => {
    const sent = await call<{ devCode?: string }>('POST', '/auth/otp/request', { phone: '+966500000001', purpose: 'LOGIN' });
    expect(sent.status).toBe(200);
    expect(sent.body.devCode).toBeUndefined();
    const guess = await call('POST', '/auth/otp/verify', { phone: '+966500000001', purpose: 'LOGIN', code: '000000' });
    expect(guess.status).toBe(401);
  });

  it('rejects access tokens of a deactivated account', async () => {
    const { DataSource } = await import('typeorm');
    const db = app.get(DataSource);
    const token = await login('khalid@guides.test');
    await db.query(`UPDATE users SET "isActive" = false WHERE email = 'khalid@guides.test'`);
    try {
      expect((await call('GET', '/auth/me', undefined, token)).status).toBe(401);
    } finally {
      await db.query(`UPDATE users SET "isActive" = true WHERE email = 'khalid@guides.test'`);
    }
  });
});

describe('arabic', () => {
  const ar = { 'accept-language': 'ar-SA,ar;q=0.9,en;q=0.5' };

  it('returns Arabic content names when asked, English otherwise', async () => {
    const en = await call('GET', '/sites?q=Hegra');
    expect(en.body.items[0].name).toBe("Hegra (Mada'in Salih)");
    const arabic = await call('GET', '/sites?q=Hegra', undefined, undefined, ar);
    expect(arabic.body.items[0].name).toBe('الحِجر (مدائن صالح)');
    expect(arabic.body.items[0].city.name).toBe('العُلا');

    const guides = await call('GET', '/guides?q=Noura', undefined, undefined, ar);
    expect(guides.body.items[0].cities.map((c: { name: string }) => c.name)).toContain('العُلا');
  });

  it('translates domain and auth errors', async () => {
    const tourist = await login('aisha@example.com');
    const guides = await call('GET', '/guides?q=Noura');
    const profile = await call('GET', `/guides/${guides.body.items[0].id}`, undefined, undefined, ar);
    expect(profile.body.packages[0].title).toMatch(/[\u0600-\u06FF]/);
    const outside = await call(
      'POST',
      '/bookings/quote',
      { packageId: profile.body.packages[0].id, startAt: `${nextWeekday(5)}T07:00:00Z`, groupSize: 2 },
      tourist,
      ar,
    );
    expect(outside.body.error).toBe('GUIDE_UNAVAILABLE');
    expect(outside.body.message).toBe('المرشد غير متاح في هذا الوقت');

    const bad = await call('POST', '/auth/login', { email: 'nobody@example.com', password: 'x' }, undefined, ar);
    expect(bad.status).toBe(401);
    expect(bad.body.message).toBe('البريد الإلكتروني أو كلمة المرور غير صحيحة');
  });

  it("sends notifications in each user's saved language", async () => {
    const guide = await login('faisal@guides.test');
    const saved = await call('PATCH', '/auth/me', { locale: 'ar' }, guide);
    expect(saved.body.locale).toBe('ar');
    expect((await call('PATCH', '/auth/me', { locale: 'fr' }, guide)).status).toBe(400);

    const { NotificationsService } = await import('../src/notifications/notifications.service');
    const me = await call('GET', '/auth/me', undefined, guide);
    await app.get(NotificationsService).notify({
      userIds: [me.body.id],
      type: 'NEW_BOOKING' as never,
      message: (lang) => (lang === 'ar' ? { title: 'حجز جديد', body: 'نص' } : { title: 'New booking', body: 'text' }),
    });
    const inbox = await call('GET', '/me/notifications', undefined, guide);
    expect(inbox.body.items[0].title).toBe('حجز جديد');
    await call('PATCH', '/auth/me', { locale: 'en' }, guide);
  });
});

describe('guide tours', () => {
  const rebase = (url: string) => url.replace(/^https?:\/\/[^/]+\/api/, base);

  it('lets a guide create, photograph, translate, edit and pause a tour', async () => {
    const guide = await login('faisal@guides.test');
    const cities = await call('GET', '/cities');
    const riyadh = cities.body.find((c: { name: string }) => c.name === 'Riyadh');
    const cairo = cities.body.find((c: { name: string }) => c.name === 'Cairo');
    const sites = await call('GET', `/sites?cityId=${riyadh.id}&limit=50`);
    const masmak = sites.body.items.find((s: { name: string }) => s.name === 'Masmak Fortress');
    const giza = (await call('GET', '/sites?q=Giza')).body.items[0];

    // Photo: signed upload, then attach the key.
    const bytes = Buffer.from('\xff\xd8\xff\xe0fake-jpeg-bytes', 'latin1');
    const grant = await call('POST', '/packages/photo-upload', { contentType: 'image/jpeg', sizeBytes: bytes.length }, guide);
    expect(grant.status).toBe(201);
    const put = await fetch(rebase(grant.body.uploadUrl), { method: 'PUT', headers: grant.body.headers, body: bytes });
    expect(put.status).toBeLessThan(300);

    const draft = {
      cityId: riyadh.id,
      title: 'Riyadh by Night',
      titleAr: 'الرياض ليلًا',
      description: 'Lights of the old city.',
      durationMinutes: 150,
      pricingType: 'PER_GROUP',
      priceMinor: 50000,
      maxGroupSize: 5,
      languages: ['ar', 'en'],
      siteIds: [masmak.id],
      photoKeys: [grant.body.key],
    };
    expect((await call('POST', '/packages', { ...draft, cityId: cairo.id }, guide)).body.error).toBe('CITY_NOT_SERVED');
    expect((await call('POST', '/packages', { ...draft, siteIds: [giza.id] }, guide)).body.error).toBe('SITE_CITY_MISMATCH');
    const foreignKey = 'packages/00000000-0000-4000-8000-000000000000/00000000-0000-4000-8000-000000000001.jpg';
    expect((await call('POST', '/packages', { ...draft, photoKeys: [foreignKey] }, guide)).body.error).toBe('PHOTO_NOT_UPLOADED');

    const created = await call('POST', '/packages', draft, guide);
    expect(created.status).toBe(201);
    expect(created.body.currency).toBe('SAR'); // from the city's country
    expect(created.body.photoUrls).toHaveLength(1);
    const photo = await fetch(rebase(created.body.photoUrls[0]));
    expect(photo.headers.get('content-type')).toMatch(/image\/jpeg/);

    // Public profile shows it, in Arabic when asked.
    const profileId = (await call('GET', '/guides?q=Faisal')).body.items[0].id;
    const arProfile = await call('GET', `/guides/${profileId}`, undefined, undefined, { 'accept-language': 'ar' });
    expect(arProfile.body.packages.map((p: { title: string }) => p.title)).toContain('الرياض ليلًا');

    // The editor gets both languages; edits and pausing work.
    const mine = await call('GET', '/packages/mine', undefined, guide, { 'accept-language': 'ar' });
    const own = mine.body.find((p: { id: string }) => p.id === created.body.id);
    expect(own).toMatchObject({ title: 'Riyadh by Night', titleAr: 'الرياض ليلًا' });
    const edited = await call('PATCH', `/packages/${created.body.id}`, { priceMinor: 55000, photoKeys: [], isActive: false }, guide);
    expect(edited.body).toMatchObject({ priceMinor: 55000, isActive: false, photoUrls: [] });
    const after = await call('GET', `/guides/${profileId}`);
    expect(after.body.packages.map((p: { id: string }) => p.id)).not.toContain(created.body.id);
    expect((await call('GET', `/packages/${created.body.id}`)).status).toBe(404);
  });

  it("refuses to edit another guide's tour", async () => {
    const other = await login('noura@guides.test');
    const mine = await call('GET', '/packages/mine', undefined, await login('faisal@guides.test'));
    const res = await call('PATCH', `/packages/${mine.body[0].id}`, { priceMinor: 1 }, other);
    expect(res.status).toBe(403);
  });
});
