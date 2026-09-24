import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Booking } from '../bookings/booking.entity';
import { NotificationType } from './notification.entities';
import { NotificationsService } from './notifications.service';

/** Tour time as the traveller sees it: in the tour city's timezone. */
export function tourTime(at: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-GB', { timeZone, weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(at);
}

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
    return {
      b,
      touristId: b.touristId,
      guideUserId: b.guide.userId,
      title: b.package.title,
      when: tourTime(b.startAt, b.package.city?.timezone ?? 'UTC'),
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
        title: 'Booking confirmed',
        body: `${c.title} with ${c.guideFirst} on ${c.when}. Your payment is held safely until the tour.`,
        data: c.data,
      });
      await this.notifications.notify({
        userIds: [c.guideUserId],
        type: NotificationType.NEW_BOOKING,
        title: 'New booking',
        body: `${c.touristFirst} booked ${c.title} for ${c.b.groupSize} on ${c.when}.`,
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
      const who = by === 'tourist' ? c.touristFirst : by === 'guide' ? c.guideFirst : 'Our team';
      await this.notifications.notify({
        userIds: recipients,
        type: NotificationType.BOOKING_CANCELLED,
        title: 'Booking cancelled',
        body: `${who} cancelled ${c.title} on ${c.when}.${by !== 'tourist' ? ` Refund: ${refundPercent}%.` : ''}`,
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
        title: 'Your tour has started',
        body: `${c.guideFirst} has started ${c.title}. Open the live tour for the SOS button and your guide's number.`,
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
        title: 'Thanks for touring with us',
        body: `How was ${c.title} with ${c.guideFirst}? Leave a review to help other travellers.`,
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
        title: 'SOS raised on your tour',
        body: `${raisedBy === 'tourist' ? c.touristFirst : c.guideFirst} pressed SOS during ${c.title}. Our safety team has been alerted.`,
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
        title: 'Our safety team is on it',
        body: 'We received your SOS and are handling it. Stay where you are if it is safe to do so.',
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
        title: 'A dispute was opened',
        body: `A dispute was opened for ${c.title} on ${c.when}. Payment is on hold while our team reviews it.`,
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
        title: 'Dispute resolved',
        body: `The dispute for ${c.title} was resolved: ${refundPercent}% refunded to the traveller.`,
        data: c.data,
      });
    } catch (e) {
      this.logger.error(`disputeResolved notification failed: ${(e as Error).message}`);
    }
  }
}
