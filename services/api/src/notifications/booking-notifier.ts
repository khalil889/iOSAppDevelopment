import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Booking } from '../bookings/booking.entity';
import { formatTourTime, Lang } from '../common/i18n/lang';
import { NotificationType } from './notification.entities';
import { NotificationsService } from './notifications.service';

/** Tour time as the traveller sees it: in the tour city's timezone. */
export function tourTime(at: Date, timeZone: string, lang: Lang = 'en'): string {
  return formatTourTime(at, timeZone, lang);
}

const ar = (lang: Lang) => lang === 'ar';

type Party = 'tourist' | 'guide';

/**
 * Turns booking lifecycle events into user notifications. Every method is
 * best-effort: failures are logged and never propagate into the booking
 * action that triggered them.
 */
@Injectable()
export class BookingNotifier {
  private readonly logger = new Logger(BookingNotifier.name);

  constructor(
    private readonly db: DataSource,
    private readonly notifications: NotificationsService,
  ) {}

  private async context(bookingId: string) {
    const b = await this.db.getRepository(Booking).findOneOrFail({
      where: { id: bookingId },
      relations: { tourist: true, guide: { user: true }, package: { city: true } },
    });
    const tz = b.package.city?.timezone ?? 'UTC';
    return {
      b,
      touristId: b.touristId,
      guideUserId: b.guide.userId,
      title: (lang: Lang) => (ar(lang) && b.package.titleAr) || b.package.title,
      when: (lang: Lang) => tourTime(b.startAt, tz, lang),
      touristFirst: b.tourist.fullName.split(' ')[0],
      guideFirst: b.guide.user.fullName.split(' ')[0],
      data: { bookingId, screen: 'booking' },
    };
  }

  async confirmed(bookingId: string) {
    try {
      const c = await this.context(bookingId);
      await this.notifications.notify({
        userIds: [c.touristId],
        type: NotificationType.BOOKING_CONFIRMED,
        message: (l) =>
          ar(l)
            ? { title: 'تم تأكيد الحجز', body: `${c.title(l)} مع ${c.guideFirst} في ${c.when(l)}. مبلغك محفوظ بأمان حتى موعد الجولة.` }
            : { title: 'Booking confirmed', body: `${c.title(l)} with ${c.guideFirst} on ${c.when(l)}. Your payment is held safely until the tour.` },
        data: c.data,
      });
      await this.notifications.notify({
        userIds: [c.guideUserId],
        type: NotificationType.NEW_BOOKING,
        message: (l) =>
          ar(l)
            ? { title: 'حجز جديد', body: `حجز ${c.touristFirst} جولة ${c.title(l)} لعدد ${c.b.groupSize} في ${c.when(l)}.` }
            : { title: 'New booking', body: `${c.touristFirst} booked ${c.title(l)} for ${c.b.groupSize} on ${c.when(l)}.` },
        data: c.data,
      });
    } catch (e) {
      this.logger.error(`confirmed notification failed: ${(e as Error).message}`);
    }
  }

  async cancelled(bookingId: string, by: Party | 'admin', refundPercent: number) {
    try {
      const c = await this.context(bookingId);
      const recipients = by === 'tourist' ? [c.guideUserId] : by === 'guide' ? [c.touristId] : [c.touristId, c.guideUserId];
      const who = (l: Lang) => (by === 'tourist' ? c.touristFirst : by === 'guide' ? c.guideFirst : ar(l) ? 'فريقنا' : 'Our team');
      await this.notifications.notify({
        userIds: recipients,
        type: NotificationType.BOOKING_CANCELLED,
        message: (l) =>
          ar(l)
            ? {
                title: 'تم إلغاء الحجز',
                body: `ألغى ${who(l)} جولة ${c.title(l)} في ${c.when(l)}.${by !== 'tourist' ? ` نسبة الاسترداد: ${refundPercent}٪.` : ''}`,
              }
            : {
                title: 'Booking cancelled',
                body: `${who(l)} cancelled ${c.title(l)} on ${c.when(l)}.${by !== 'tourist' ? ` Refund: ${refundPercent}%.` : ''}`,
              },
        data: c.data,
      });
    } catch (e) {
      this.logger.error(`cancelled notification failed: ${(e as Error).message}`);
    }
  }

  async started(bookingId: string) {
    try {
      const c = await this.context(bookingId);
      await this.notifications.notify({
        userIds: [c.touristId],
        type: NotificationType.TOUR_STARTED,
        message: (l) =>
          ar(l)
            ? { title: 'بدأت جولتك', body: `بدأ ${c.guideFirst} جولة ${c.title(l)}. افتح الجولة المباشرة لزر الطوارئ ورقم المرشد.` }
            : { title: 'Your tour has started', body: `${c.guideFirst} has started ${c.title(l)}. Open the live tour for the SOS button and your guide's number.` },
        data: { ...c.data, screen: 'live' },
      });
    } catch (e) {
      this.logger.error(`started notification failed: ${(e as Error).message}`);
    }
  }

  async completed(bookingId: string) {
    try {
      const c = await this.context(bookingId);
      await this.notifications.notify({
        userIds: [c.touristId],
        type: NotificationType.TOUR_COMPLETED,
        message: (l) =>
          ar(l)
            ? { title: 'شكرًا لجولتك معنا', body: `كيف كانت جولة ${c.title(l)} مع ${c.guideFirst}؟ شارك تقييمك لمساعدة المسافرين الآخرين.` }
            : { title: 'Thanks for touring with us', body: `How was ${c.title(l)} with ${c.guideFirst}? Leave a review to help other travellers.` },
        data: { ...c.data, screen: 'review' },
      });
    } catch (e) {
      this.logger.error(`completed notification failed: ${(e as Error).message}`);
    }
  }

  async sosRaised(bookingId: string, raisedBy: Party) {
    try {
      const c = await this.context(bookingId);
      await this.notifications.notify({
        userIds: [raisedBy === 'tourist' ? c.guideUserId : c.touristId],
        type: NotificationType.SOS_RAISED,
        message: (l) => {
          const who = raisedBy === 'tourist' ? c.touristFirst : c.guideFirst;
          return ar(l)
            ? { title: 'تنبيه طوارئ في جولتك', body: `ضغط ${who} زر الطوارئ أثناء ${c.title(l)}. تم إبلاغ فريق السلامة.` }
            : { title: 'SOS raised on your tour', body: `${who} pressed SOS during ${c.title(l)}. Our safety team has been alerted.` };
        },
        data: { ...c.data, screen: 'live' },
      });
    } catch (e) {
      this.logger.error(`sosRaised notification failed: ${(e as Error).message}`);
    }
  }

  async sosAcknowledged(bookingId: string, raisedById: string) {
    try {
      await this.notifications.notify({
        userIds: [raisedById],
        type: NotificationType.SOS_ACKNOWLEDGED,
        message: (l) =>
          ar(l)
            ? { title: 'فريق السلامة يتابع الأمر', body: 'استلمنا تنبيه الطوارئ ونتعامل معه الآن. ابقَ في مكانك إن كان ذلك آمنًا.' }
            : { title: 'Our safety team is on it', body: 'We received your SOS and are handling it. Stay where you are if it is safe to do so.' },
        data: { bookingId, screen: 'live' },
      });
    } catch (e) {
      this.logger.error(`sosAcknowledged notification failed: ${(e as Error).message}`);
    }
  }

  async disputeOpened(bookingId: string, openedByUserId: string) {
    try {
      const c = await this.context(bookingId);
      const other = openedByUserId === c.touristId ? c.guideUserId : c.touristId;
      await this.notifications.notify({
        userIds: [other],
        type: NotificationType.DISPUTE_OPENED,
        message: (l) =>
          ar(l)
            ? { title: 'تم فتح نزاع', body: `فُتح نزاع بخصوص ${c.title(l)} في ${c.when(l)}. المبلغ معلّق حتى يراجعه فريقنا.` }
            : { title: 'A dispute was opened', body: `A dispute was opened for ${c.title(l)} on ${c.when(l)}. Payment is on hold while our team reviews it.` },
        data: c.data,
      });
    } catch (e) {
      this.logger.error(`disputeOpened notification failed: ${(e as Error).message}`);
    }
  }

  async disputeResolved(bookingId: string, refundPercent: number) {
    try {
      const c = await this.context(bookingId);
      await this.notifications.notify({
        userIds: [c.touristId, c.guideUserId],
        type: NotificationType.DISPUTE_RESOLVED,
        message: (l) =>
          ar(l)
            ? { title: 'تمت تسوية النزاع', body: `تمت تسوية النزاع بخصوص ${c.title(l)}: استرداد ${refundPercent}٪ للمسافر.` }
            : { title: 'Dispute resolved', body: `The dispute for ${c.title(l)} was resolved: ${refundPercent}% refunded to the traveller.` },
        data: c.data,
      });
    } catch (e) {
      this.logger.error(`disputeResolved notification failed: ${(e as Error).message}`);
    }
  }
}
