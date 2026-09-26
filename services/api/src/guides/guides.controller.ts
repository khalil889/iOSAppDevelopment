import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { GuideSearchQuery, LicenseUploadDto, SubmitApplicationDto, UpdateGuideProfileDto } from './dto';
import { GuidesService } from './guides.service';
import { IdentityService } from './identity.service';

@ApiTags('guides')
@Controller('guides')
export class GuidesController {
  constructor(
    private readonly guides: GuidesService,
    private readonly identity: IdentityService,
  ) {}

  /** Verified guides only. See GuideSearchQuery for filters. */
  @Public()
  @Get()
  search(@Query() q: GuideSearchQuery) {
    return this.guides.search(q);
  }

  @ApiBearerAuth()
  @Roles(UserRole.GUIDE)
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.guides.getByUserId(user.id);
  }

  @ApiBearerAuth()
  @Roles(UserRole.GUIDE)
  @Patch('me')
  update(@CurrentUser() user: AuthUser, @Body() dto: UpdateGuideProfileDto) {
    return this.guides.updateProfile(user.id, dto);
  }

  /** Step 1 of submitting a license scan: get a signed upload URL, then PUT the file to it. */
  @ApiBearerAuth()
  @Roles(UserRole.GUIDE)
  @Post('me/license-upload')
  licenseUpload(@CurrentUser() user: AuthUser, @Body() dto: LicenseUploadDto) {
    return this.guides.createLicenseUpload(user.id, dto);
  }

  /** Starts ID + selfie verification: returns a hosted link to open. */
  @ApiBearerAuth()
  @Roles(UserRole.GUIDE)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('me/identity')
  startIdentity(@CurrentUser() user: AuthUser) {
    return this.identity.start(user.id);
  }

  @ApiBearerAuth()
  @Roles(UserRole.GUIDE)
  @Post('me/application')
  submit(@CurrentUser() user: AuthUser, @Body() dto: SubmitApplicationDto) {
    return this.guides.submitApplication(user.id, dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.GUIDE)
  @Get('me/dashboard')
  dashboard(@CurrentUser() user: AuthUser) {
    return this.guides.dashboard(user.id);
  }

  @Public()
  @Get(':id')
  profile(@Param('id', ParseUUIDPipe) id: string) {
    return this.guides.publicProfile(id);
  }
}
