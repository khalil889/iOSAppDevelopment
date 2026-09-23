import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { CreateReviewDto } from './dto';
import { ReviewsService } from './reviews.service';

@ApiTags('reviews')
@ApiBearerAuth()
@Controller('bookings/:bookingId/review')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  /** Only for COMPLETED bookings, by the booking tourist, once. */
  @Roles(UserRole.TOURIST)
  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviews.create(user, bookingId, dto);
  }
}
