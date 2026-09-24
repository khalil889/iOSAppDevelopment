import { Body, Controller, Get, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { GuidesService } from '../guides/guides.service';
import { AvailabilityService } from './availability.service';
import { SlotsQuery, UpdateAvailabilityDto } from './dto';

@ApiTags('availability')
@Controller()
export class AvailabilityController {
  constructor(
    private readonly availability: AvailabilityService,
    private readonly guides: GuidesService,
  ) {}

  /** Free start times for a package on a local date (city timezone). */
  @Public()
  @Get('availability/slots')
  slots(@Query() q: SlotsQuery) {
    return this.availability.slots(q);
  }

  @ApiBearerAuth()
  @Roles(UserRole.GUIDE)
  @Get('guides/me/availability')
  async mine(@CurrentUser() user: AuthUser) {
    const guide = await this.guides.getByUserId(user.id);
    return this.availability.forGuide(guide.id);
  }

  /** Replaces weekly hours and time off. Existing bookings are not affected. */
  @ApiBearerAuth()
  @Roles(UserRole.GUIDE)
  @Put('guides/me/availability')
  async update(@CurrentUser() user: AuthUser, @Body() dto: UpdateAvailabilityDto) {
    const guide = await this.guides.getByUserId(user.id);
    return this.availability.replace(guide.id, dto);
  }
}
