import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { CreatePackageDto, UpdatePackageDto } from './dto';
import { PackagesService } from './packages.service';

@ApiTags('packages')
@Controller('packages')
export class PackagesController {
  constructor(private readonly packages: PackagesService) {}

  @ApiBearerAuth()
  @Roles(UserRole.GUIDE)
  @Get('mine')
  mine(@CurrentUser() user: AuthUser) {
    return this.packages.mine(user.id);
  }

  @Public()
  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.packages.getPublic(id);
  }

  @ApiBearerAuth()
  @Roles(UserRole.GUIDE)
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePackageDto) {
    return this.packages.create(user.id, dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.GUIDE)
  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePackageDto) {
    return this.packages.update(user.id, id, dto);
  }
}
