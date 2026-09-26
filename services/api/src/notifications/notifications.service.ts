import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource, In, IsNull } from 'typeorm';
import { Lang, toLang } from '../common/i18n/lang';
import { Paginated } from '../common/pagination';
import { User } from '../users/user.entity';
import { PUSH_SENDER, PushSender } from '../providers/push/push-sender.interface';
import { DeviceToken, Notification, NotificationType } from './notification.entities';

export type NotificationText = { title: string; body: string };

export interface NotifyInput {
  userIds: string[];
  type: NotificationType;
  /** Rendered once per recipient language (the user's saved locale). */
  message: (lang: Lang) => NotificationText;
  data?: Record<string, string>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly db: DataSource,
    @Inject(PUSH_SENDER) private readonly push: PushSender,
  ) {}

  /**
   * Stores the notification for each user and pushes it to their devices.
   * Never throws: notifications are a side effect and must not fail the
   * action that caused them.
   */
  async notify(input: NotifyInput): Promise<void> {
    const userIds = [...new Set(input.userIds.filter(Boolean))];
    if (!userIds.length) return;
    const data = { type: input.type, ...(input.data ?? {}) };
    try {
      const users = await this.db.getRepository(User).find({ where: { id: In(userIds) }, select: { id: true, locale: true } });
      const byLang = new Map<Lang, string[]>();
      for (const u of users) byLang.set(toLang(u.locale), [...(byLang.get(toLang(u.locale)) ?? []), u.id]);

      for (const [lang, ids] of byLang) {
        const text = input.message(lang);
        await this.db.getRepository(Notification).insert(ids.map((userId) => ({ userId, type: input.type, ...text, data })));
        const devices = await this.db.getRepository(DeviceToken).find({ where: { userId: In(ids) }, select: { token: true } });
        if (!devices.length) continue;
        const res = await this.push.send(
          devices.map((d) => d.token),
          { ...text, data },
        );
        if (res.invalidTokens.length) {
          await this.db.getRepository(DeviceToken).delete({ token: In(res.invalidTokens) });
        }
      }
    } catch (e) {
      this.logger.error(`notify ${input.type} failed: ${(e as Error).message}`);
    }
  }

  // ---- devices -------------------------------------------------------------
  async registerDevice(userId: string, token: string, platform: DeviceToken['platform']) {
    // Upsert on token: the same phone may switch accounts.
    await this.db
      .getRepository(DeviceToken)
      .upsert({ userId, token, platform, lastSeenAt: new Date() }, { conflictPaths: ['token'] });
    return { registered: true };
  }

  async unregisterDevice(userId: string, token: string) {
    await this.db.getRepository(DeviceToken).delete({ userId, token });
    return { registered: false };
  }

  // ---- inbox ---------------------------------------------------------------
  async inbox(userId: string, page: number, limit: number): Promise<Paginated<Notification> & { unread: number }> {
    const repo = this.db.getRepository(Notification);
    const [[items, total], unread] = await Promise.all([
      repo.findAndCount({ where: { userId }, order: { createdAt: 'DESC' }, skip: (page - 1) * limit, take: limit }),
      repo.count({ where: { userId, readAt: IsNull() } }),
    ]);
    return { items, total, page, limit, unread };
  }

  async markRead(userId: string, ids?: string[]) {
    const where = ids?.length ? { userId, id: In(ids), readAt: IsNull() } : { userId, readAt: IsNull() };
    const res = await this.db.getRepository(Notification).update(where, { readAt: new Date() });
    return { updated: res.affected ?? 0 };
  }

  // ---- review reminders ----------------------------------------------------
  /** Once, 20-48h after a tour ends, remind tourists who haven't reviewed. */
  @Cron(CronExpression.EVERY_HOUR)
  async sendReviewReminders(now = new Date()): Promise<number> {
    const rows: Array<{ id: string; touristId: string; title: string; titleAr: string | null; guideName: string }> = await this.db.query(
      `SELECT b.id, b."touristId", p.title, p."titleAr", u."fullName" AS "guideName"
         FROM bookings b
         JOIN tour_packages p ON p.id = b."packageId"
         JOIN guides g ON g.id = b."guideId"
         JOIN users u ON u.id = g."userId"
        WHERE b.status = 'COMPLETED'
          AND b."completedAt" BETWEEN $1 AND $2
          AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r."bookingId" = b.id)
          AND NOT EXISTS (SELECT 1 FROM notifications n
                           WHERE n.type = 'REVIEW_REMINDER' AND n.data->>'bookingId' = b.id::text)
        LIMIT 500`,
      [new Date(now.getTime() - 48 * 3_600_000), new Date(now.getTime() - 20 * 3_600_000)],
    );
    for (const r of rows) {
      await this.notify({
        userIds: [r.touristId],
        type: NotificationType.REVIEW_REMINDER,
        message: (lang) => {
          const guide = r.guideName.split(' ')[0];
          return lang === 'ar'
            ? { title: 'كيف كانت جولتك؟', body: `شارك المسافرين تجربتك في ${r.titleAr || r.title} مع ${guide}.` }
            : { title: 'How was your tour?', body: `Tell other travellers about ${r.title} with ${guide}.` };
        },
        data: { bookingId: r.id, screen: 'review' },
      });
    }
    if (rows.length) this.logger.log(`Sent ${rows.length} review reminder(s)`);
    return rows.length;
  }
}
