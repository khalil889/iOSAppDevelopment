import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GuidesModule } from '../guides/guides.module';
import { AvailabilityController } from './availability.controller';
import { GuideTimeOff, GuideWeeklyHours } from './availability.entities';
import { AvailabilityService } from './availability.service';

@Module({
  imports: [TypeOrmModule.forFeature([GuideWeeklyHours, GuideTimeOff]), GuidesModule],
  controllers: [AvailabilityController],
  providers: [AvailabilityService],
  exports: [AvailabilityService],
})
export class AvailabilityModule {}
