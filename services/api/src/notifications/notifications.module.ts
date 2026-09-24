import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceToken, Notification } from './notification.entities';
import { NotificationsController } from './notifications.controller';
import { BookingNotifier } from './booking-notifier';
import { NotificationsService } from './notifications.service';

/** Global so any feature module can notify users without import cycles. */
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([DeviceToken, Notification])],
  controllers: [NotificationsController],
  providers: [NotificationsService, BookingNotifier],
  exports: [NotificationsService, BookingNotifier],
})
export class NotificationsModule {}
