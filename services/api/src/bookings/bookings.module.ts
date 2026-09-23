import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GuidesModule } from '../guides/guides.module';
import { PaymentsModule } from '../payments/payments.module';
import { Booking } from './booking.entity';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { SosAlert } from './sos-alert.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, SosAlert]), GuidesModule, PaymentsModule],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
