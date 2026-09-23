import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GuidesModule } from '../guides/guides.module';
import { PackagesController } from './packages.controller';
import { PackagesService } from './packages.service';
import { TourPackage } from './tour-package.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TourPackage]), GuidesModule],
  controllers: [PackagesController],
  providers: [PackagesService],
})
export class PackagesModule {}
