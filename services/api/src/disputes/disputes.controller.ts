import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { DisputesService } from './disputes.service';
import { OpenDisputeDto } from './dto';

@ApiTags('disputes')
@ApiBearerAuth()
@Controller()
export class DisputesController {
  constructor(private readonly disputes: DisputesService) {}

  /** Freezes escrow until an admin resolves the dispute. */
  @Post('bookings/:bookingId/disputes')
  open(
    @CurrentUser() user: AuthUser,
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
    @Body() dto: OpenDisputeDto,
  ) {
    return this.disputes.open(user, bookingId, dto);
  }

  @Get('disputes/mine')
  mine(@CurrentUser() user: AuthUser) {
    return this.disputes.mine(user);
  }
}
