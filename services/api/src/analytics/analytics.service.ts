import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AnalyticsQuery } from './dto';

const n = (v: unknown) => Number(v ?? 0);

/**
 * Marketplace metrics for the admin dashboard. Counts cover all currencies;
 * money is reported for one currency at a time (no FX conversion).
 * Days are bucketed in Asia/Riyadh time.
 */
@Injectable()
export class AnalyticsService {
  constructor(private readonly db: DataSource) {}

  async overview(q: AnalyticsQuery, now = new Date()) {
    const to = now;
    const from = new Date(now.getTime() - q.days * 86_400_000);
    const prevFrom = new Date(from.getTime() - q.days * 86_400_000);
    const params = [from, to, q.currency];

    const [bookings, prevBookings, money, prevMoney, users, reviews, safety, daily, cities, guides, funnel, currencies] =
      await Promise.all([
        this.bookingCounts(from, to),
        this.bookingCounts(prevFrom, from),
        this.money(from, to, q.currency),
        this.money(prevFrom, from, q.currency),
        this.db.query(
          `SELECT COUNT(*) FILTER (WHERE role = 'TOURIST')::int AS tourists,
                  COUNT(*) FILTER (WHERE role = 'GUIDE')::int AS guides
             FROM users WHERE "createdAt" >= $1 AND "createdAt" < $2`,
          [from, to],
        ),
        this.db.query(
          `SELECT COUNT(*)::int AS count, COALESCE(AVG(rating), 0)::float AS avg
             FROM reviews WHERE "createdAt" >= $1 AND "createdAt" < $2`,
          [from, to],
        ),
        this.db.query(
          `SELECT (SELECT COUNT(*) FROM disputes WHERE "createdAt" >= $1 AND "createdAt" < $2)::int AS disputes,
                  (SELECT COUNT(*) FROM disputes WHERE status = 'OPEN')::int AS "openDisputes",
                  (SELECT COUNT(*) FROM sos_alerts WHERE "createdAt" >= $1 AND "createdAt" < $2)::int AS sos`,
          [from, to],
        ),
        this.db.query(
          `WITH days AS (
             SELECT generate_series(
               date_trunc('day', $1::timestamptz AT TIME ZONE 'Asia/Riyadh'),
               date_trunc('day', $2::timestamptz AT TIME ZONE 'Asia/Riyadh'),
               interval '1 day') AS day
           )
           SELECT to_char(d.day, 'YYYY-MM-DD') AS date,
                  (SELECT COUNT(*) FROM bookings b
                    WHERE date_trunc('day', b."createdAt" AT TIME ZONE 'Asia/Riyadh') = d.day)::int AS bookings,
                  (SELECT COALESCE(SUM(p."amountMinor"), 0) FROM payments p
                    WHERE p.currency = $3 AND p."heldAt" IS NOT NULL
                      AND date_trunc('day', p."heldAt" AT TIME ZONE 'Asia/Riyadh') = d.day)::bigint AS "gmvMinor"
             FROM days d ORDER BY d.day`,
          params,
        ),
        this.db.query(
          `SELECT c.id, c.name, c."nameAr", COUNT(b.id)::int AS bookings,
                  COALESCE(SUM(p."amountMinor") FILTER (WHERE p.currency = $3 AND p."heldAt" IS NOT NULL), 0)::bigint AS "gmvMinor"
             FROM bookings b
             JOIN tour_packages t ON t.id = b."packageId"
             JOIN cities c ON c.id = t."cityId"
             LEFT JOIN payments p ON p."bookingId" = b.id
            WHERE b."createdAt" >= $1 AND b."createdAt" < $2
            GROUP BY c.id ORDER BY bookings DESC, "gmvMinor" DESC LIMIT 6`,
          params,
        ),
        this.db.query(
          `SELECT g.id, u."fullName" AS name, g."ratingAvg"::float AS rating, COUNT(b.id)::int AS bookings,
                  COALESCE(SUM(p."amountMinor") FILTER (WHERE p.currency = $3 AND p."heldAt" IS NOT NULL), 0)::bigint AS "gmvMinor"
             FROM bookings b
             JOIN guides g ON g.id = b."guideId"
             JOIN users u ON u.id = g."userId"
             LEFT JOIN payments p ON p."bookingId" = b.id
            WHERE b."createdAt" >= $1 AND b."createdAt" < $2
            GROUP BY g.id, u."fullName" ORDER BY bookings DESC, "gmvMinor" DESC LIMIT 6`,
          params,
        ),
        this.db.query(`SELECT "verificationStatus" AS status, COUNT(*)::int AS count FROM guides GROUP BY 1`),
        this.db.query(`SELECT DISTINCT currency FROM payments ORDER BY currency`),
      ]);

    return {
      range: { from, to, days: q.days, currency: q.currency, timeZone: 'Asia/Riyadh' },
      bookings: { ...bookings, previous: prevBookings },
      money: { ...money, previous: prevMoney },
      users: { newTourists: n(users[0]?.tourists), newGuides: n(users[0]?.guides) },
      reviews: { count: n(reviews[0]?.count), avgRating: Math.round(n(reviews[0]?.avg) * 100) / 100 },
      safety: { disputes: n(safety[0]?.disputes), openDisputes: n(safety[0]?.openDisputes), sosAlerts: n(safety[0]?.sos) },
      daily: daily.map((d: { date: string; bookings: number; gmvMinor: string }) => ({
        date: d.date,
        bookings: n(d.bookings),
        gmvMinor: n(d.gmvMinor),
      })),
      topCities: cities.map((c: Record<string, unknown>) => ({ ...c, gmvMinor: n(c.gmvMinor) })),
      topGuides: guides.map((g: Record<string, unknown>) => ({ ...g, gmvMinor: n(g.gmvMinor) })),
      guideFunnel: Object.fromEntries(funnel.map((f: { status: string; count: number }) => [f.status, n(f.count)])),
      currencies: currencies.map((c: { currency: string }) => c.currency),
    };
  }

  private async bookingCounts(from: Date, to: Date) {
    const [r] = await this.db.query(
      `SELECT COUNT(*)::int AS created,
              COUNT(*) FILTER (WHERE status IN ('CONFIRMED', 'IN_PROGRESS', 'COMPLETED'))::int AS paid,
              COUNT(*) FILTER (WHERE status = 'COMPLETED')::int AS completed,
              COUNT(*) FILTER (WHERE status = 'CANCELLED')::int AS cancelled
         FROM bookings WHERE "createdAt" >= $1 AND "createdAt" < $2`,
      [from, to],
    );
    const created = n(r?.created);
    return {
      created,
      paid: n(r?.paid),
      completed: n(r?.completed),
      cancelled: n(r?.cancelled),
      /** Share of created bookings that were paid. */
      conversion: created ? Math.round((n(r?.paid) / created) * 1000) / 1000 : 0,
    };
  }

  /** GMV = payments captured; revenue = what the platform keeps after refunds and guide payouts. */
  private async money(from: Date, to: Date, currency: string) {
    const [r] = await this.db.query(
      `SELECT
         COALESCE(SUM("amountMinor") FILTER (WHERE "heldAt" >= $1 AND "heldAt" < $2), 0)::bigint AS gmv,
         COALESCE(SUM("refundedMinor") FILTER (WHERE "refundedAt" >= $1 AND "refundedAt" < $2), 0)::bigint AS refunds,
         COALESCE(SUM("releasedMinor") FILTER (WHERE "releasedAt" >= $1 AND "releasedAt" < $2), 0)::bigint AS released,
         COALESCE(SUM("amountMinor" - "refundedMinor" - "releasedMinor")
           FILTER (WHERE "releasedAt" >= $1 AND "releasedAt" < $2), 0)::bigint AS revenue,
         COALESCE(SUM("amountMinor") FILTER (WHERE "escrowStatus" IN ('HELD', 'DISPUTED', 'SETTLING')), 0)::bigint AS "inEscrow"
       FROM payments WHERE currency = $3`,
      [from, to, currency],
    );
    return {
      gmvMinor: n(r?.gmv),
      refundsMinor: n(r?.refunds),
      guidePayoutsMinor: n(r?.released),
      platformRevenueMinor: n(r?.revenue),
      inEscrowMinor: n(r?.inEscrow),
    };
  }
}
