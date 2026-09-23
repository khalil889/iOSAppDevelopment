import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { SosAlert } from '../bookings/sos-alert.entity';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { DisputesService } from '../disputes/disputes.service';
import { DisputeListQuery, ResolveDisputeDto } from '../disputes/dto';
import { PaymentsService } from '../payments/payments.service';
import { AdminGuidesService } from './admin-guides.service';
import { ApproveGuideDto, RejectGuideDto, VerificationQueueQuery } from './dto';

@ApiTags('admin')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly guides: AdminGuidesService,
    private readonly disputes: DisputesService,
    private readonly payments: PaymentsService,
    private readonly db: DataSource,
  ) {}

  // ---- Guide verification --------------------------------------------------
  @Get('guides')
  queue(@Query() q: VerificationQueueQuery) {
    return this.guides.queue(q);
  }

  @Get('guides/counts')
  counts() {
    return this.guides.counts();
  }

  @Get('guides/:id')
  detail(@Param('id', ParseUUIDPipe) id: string) {
    return this.guides.detail(id);
  }

  @HttpCode(200)
  @Post('guides/:id/approve')
  approve(@CurrentUser() admin: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ApproveGuideDto) {
    return this.guides.approve(admin.id, id, dto.note);
  }

  @HttpCode(200)
  @Post('guides/:id/reject')
  reject(@CurrentUser() admin: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: RejectGuideDto) {
    return this.guides.reject(admin.id, id, dto.reason);
  }

  @HttpCode(200)
  @Post('guides/:id/suspend')
  suspend(@CurrentUser() admin: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: RejectGuideDto) {
    return this.guides.suspend(admin.id, id, dto.reason);
  }

  // ---- Disputes & safety ---------------------------------------------------
  @Get('disputes')
  listDisputes(@Query() q: DisputeListQuery) {
    return this.disputes.list(q);
  }

  @HttpCode(200)
  @Post('disputes/:id/resolve')
  resolve(@CurrentUser() admin: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ResolveDisputeDto) {
    return this.disputes.resolve(admin.id, id, dto);
  }

  @Get('sos')
  sos() {
    return this.db.getRepository(SosAlert).find({ relations: { booking: true }, order: { createdAt: 'DESC' }, take: 100 });
  }

  /** Manually trigger the escrow release job (normally runs every 10 min). */
  @HttpCode(200)
  @Post('payments/release-due')
  async releaseDue() {
    return { released: await this.payments.releaseDue() };
  }
}
