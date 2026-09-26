import { Body, Controller, Get, Header, HttpCode, Param, ParseUUIDPipe, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { CreatePayoutRunDto, MarkPayoutFailedDto, MarkPayoutPaidDto, PayoutAccountDto } from './dto';
import { PayoutsService } from './payouts.service';

@ApiTags('payouts')
@ApiBearerAuth()
@Roles(UserRole.GUIDE)
@Controller('guides/me')
export class GuidePayoutsController {
  constructor(private readonly payouts: PayoutsService) {}

  /** Owed balance per currency, payout history and the (masked) bank account. */
  @Get('earnings')
  earnings(@CurrentUser() user: AuthUser) {
    return this.payouts.overview(user.id);
  }

  @Get('payout-account')
  async account(@CurrentUser() user: AuthUser) {
    return { account: await this.payouts.account(user.id) };
  }

  @Put('payout-account')
  save(@CurrentUser() user: AuthUser, @Body() dto: PayoutAccountDto) {
    return this.payouts.saveAccount(user.id, dto);
  }
}

@ApiTags('admin')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/payouts')
export class AdminPayoutsController {
  constructor(private readonly payouts: PayoutsService) {}

  @Get('owed')
  owed() {
    return this.payouts.owedSummary();
  }

  @Get('runs')
  runs() {
    return this.payouts.runs();
  }

  @Post('runs')
  createRun(@CurrentUser() user: AuthUser, @Body() dto: CreatePayoutRunDto) {
    return this.payouts.createRun(user.id, dto);
  }

  @Get('runs/:id')
  run(@Param('id', ParseUUIDPipe) id: string) {
    return this.payouts.run(id);
  }

  @Get('runs/:id/export')
  @Header('content-type', 'text/csv; charset=utf-8')
  @Header('cache-control', 'no-store')
  export(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.payouts.exportCsv(user.id, id);
  }

  @HttpCode(200)
  @Post(':id/paid')
  paid(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: MarkPayoutPaidDto) {
    return this.payouts.markPaid(user.id, id, dto.reference);
  }

  @HttpCode(200)
  @Post(':id/failed')
  failed(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: MarkPayoutFailedDto) {
    return this.payouts.markFailed(user.id, id, dto.reason);
  }
}
