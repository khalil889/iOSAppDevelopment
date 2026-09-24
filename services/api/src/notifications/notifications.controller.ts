import { Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationQuery } from '../common/pagination';
import { MarkReadDto, RegisterDeviceDto, UnregisterDeviceDto } from './dto';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('me')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  /** Register this phone's FCM token for push notifications. */
  @HttpCode(200)
  @Post('devices')
  register(@CurrentUser() user: AuthUser, @Body() dto: RegisterDeviceDto) {
    return this.notifications.registerDevice(user.id, dto.token, dto.platform);
  }

  /** Call on sign-out so the phone stops receiving this user's pushes. */
  @HttpCode(200)
  @Post('devices/unregister')
  unregister(@CurrentUser() user: AuthUser, @Body() dto: UnregisterDeviceDto) {
    return this.notifications.unregisterDevice(user.id, dto.token);
  }

  @Get('notifications')
  inbox(@CurrentUser() user: AuthUser, @Query() q: PaginationQuery) {
    return this.notifications.inbox(user.id, q.page, q.limit);
  }

  @HttpCode(200)
  @Post('notifications/read')
  read(@CurrentUser() user: AuthUser, @Body() dto: MarkReadDto) {
    return this.notifications.markRead(user.id, dto.ids);
  }
}
