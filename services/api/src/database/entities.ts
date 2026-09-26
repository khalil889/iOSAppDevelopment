import { AuthSession } from '../auth/auth-session.entity';
import { OtpCode } from '../auth/otp-code.entity';
import { GuideTimeOff, GuideWeeklyHours } from '../availability/availability.entities';
import { Booking } from '../bookings/booking.entity';
import { SosAlert } from '../bookings/sos-alert.entity';
import { Dispute } from '../disputes/dispute.entity';
import { DeviceToken, Notification } from '../notifications/notification.entities';
import { City } from '../geo/city.entity';
import { Country } from '../geo/country.entity';
import { Site } from '../geo/site.entity';
import { Guide } from '../guides/guide.entity';
import { GuideVerificationEvent } from '../guides/guide-verification-event.entity';
import { TourPackage } from '../packages/tour-package.entity';
import { Payment } from '../payments/payment.entity';
import { Review } from '../reviews/review.entity';
import { User } from '../users/user.entity';
import { Payout, PayoutAccount, PayoutRun } from '../payouts/payout.entities';

export const ENTITIES = [
  User,
  OtpCode,
  Country,
  City,
  Site,
  Guide,
  GuideVerificationEvent,
  TourPackage,
  Booking,
  SosAlert,
  Payment,
  Review,
  Dispute,
  GuideWeeklyHours,
  GuideTimeOff,
  DeviceToken,
  Notification,
  AuthSession,
  PayoutAccount,
  PayoutRun,
  Payout,
];

export {
  User,
  OtpCode,
  Country,
  City,
  Site,
  Guide,
  GuideVerificationEvent,
  TourPackage,
  Booking,
  SosAlert,
  Payment,
  Review,
  Dispute,
  GuideWeeklyHours,
  GuideTimeOff,
  DeviceToken,
  Notification,
  AuthSession,
  PayoutAccount,
  PayoutRun,
  Payout,
};
