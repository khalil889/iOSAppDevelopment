import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { City } from './city.entity';
import { Country } from './country.entity';
import { GeoController } from './geo.controller';
import { GeoService } from './geo.service';
import { Site } from './site.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Country, City, Site])],
  controllers: [GeoController],
  providers: [GeoService],
  exports: [GeoService],
})
export class GeoModule {}
