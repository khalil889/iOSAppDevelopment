import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { CreatePackageDto, PackagePhotoUploadDto, UpdatePackageDto } from './dto';
import { PackagesService } from './packages.service';
import { RawContent } from '../common/i18n/localize.interceptor';

@ApiTags('packages')
@Controller('packages')
export class PackagesController {
  constructor(private readonly packages: PackagesService) {}

  @ApiBearerAuth()
  @Roles(UserRole.GUIDE)
  @RawContent() // the guide's edit form needs both languages
  @Get('mine')
  mine(@CurrentUser() user: AuthUser) {
    return this.packages.mine(user.id);
  }

  @ApiBearerAuth()
  @Roles(UserRole.GUIDE)
  @Post('photo-upload')
  photoUpload(@CurrentUser() user: AuthUser, @Body() dto: PackagePhotoUploadDto) {
    return this.packages.createPhotoUpload(user.id, dto);
  }

  @Public()
  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.packages.getPublic(id);
  }

  @ApiBearerAuth()
  @Roles(UserRole.GUIDE)
  @RawContent()
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePackageDto) {
    return this.packages.create(user.id, dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.GUIDE)
  @RawContent()
  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePackageDto) {
    return this.packages.update(user.id, id, dto);
  }
}
