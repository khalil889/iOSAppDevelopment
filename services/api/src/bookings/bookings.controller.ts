import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { BookingsService } from './bookings.service';
import { BookingListQuery, CancelBookingDto, CreateBookingDto, PayBookingDto, SosDto } from './dto';

@ApiTags('bookings')
@ApiBearerAuth()
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  /** Price + schedule preview; runs every booking rule without saving. */
  @Roles(UserRole.TOURIST)
  @HttpCode(200)
  @Post('quote')
  quote(@CurrentUser() user: AuthUser, @Body() dto: CreateBookingDto) {
    return this.bookings.quote(user, dto);
  }

  /** Creates a PENDING_PAYMENT booking that holds the slot for 15 minutes. */
  @Roles(UserRole.TOURIST)
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateBookingDto) {
    return this.bookings.create(user, dto);
  }

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() q: BookingListQuery) {
    return this.bookings.list(user, q);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.bookings.get(user, id);
  }

  /** Charges the tourist and holds funds in escrow → CONFIRMED. */
  @HttpCode(200)
  @Post(':id/pay')
  pay(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: PayBookingDto) {
    return this.bookings.pay(user, id, dto.paymentMethodToken);
  }

  /** After 3-D Secure: re-check the pending payment and confirm the booking. */
  @HttpCode(200)
  @Post(':id/pay/confirm')
  confirmPayment(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.bookings.confirmPayment(user, id);
  }

  @Roles(UserRole.GUIDE)
  @HttpCode(200)
  @Post(':id/start')
  start(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.bookings.start(user, id);
  }

  @Roles(UserRole.GUIDE, UserRole.ADMIN)
  @HttpCode(200)
  @Post(':id/complete')
  complete(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.bookings.complete(user, id);
  }

  @HttpCode(200)
  @Post(':id/cancel')
  cancel(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: CancelBookingDto) {
    return this.bookings.cancel(user, id, dto);
  }

  /** Emergency alert from the live-tour screen. */
  @Post(':id/sos')
  sos(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: SosDto) {
    return this.bookings.sos(user, id, dto);
  }
}
