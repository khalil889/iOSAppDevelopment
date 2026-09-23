import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { CityQuery, SiteSearchQuery } from './dto';
import { GeoService } from './geo.service';

@ApiTags('explore')
@Public()
@Controller()
export class GeoController {
  constructor(private readonly geo: GeoService) {}

  @Get('countries')
  countries() {
    return this.geo.listCountries();
  }

  @Get('cities')
  cities(@Query() q: CityQuery) {
    return this.geo.listCities(q);
  }

  /** Filters: q, countryId, cityId, category, lat+lng(+radiusKm) — sorted by distance when near. */
  @Get('sites')
  sites(@Query() q: SiteSearchQuery) {
    return this.geo.searchSites(q);
  }

  @Get('sites/:id')
  site(@Param('id', ParseUUIDPipe) id: string) {
    return this.geo.getSite(id);
  }
}
