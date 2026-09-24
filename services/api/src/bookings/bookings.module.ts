import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AvailabilityModule } from '../availability/availability.module';
import { GuidesModule } from '../guides/guides.module';
import { PaymentsModule } from '../payments/payments.module';
import { Booking } from './booking.entity';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { PaymentWebhooksController } from './payment-webhooks.controller';
import { SosAlert } from './sos-alert.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, SosAlert]), GuidesModule, PaymentsModule, AvailabilityModule],
  controllers: [BookingsController, PaymentWebhooksController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
