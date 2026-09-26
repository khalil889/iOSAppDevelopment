import { Body, Controller, Get, Headers, HttpCode, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginDto, RefreshDto, RegisterDto, RequestOtpDto, UpdateMeDto, VerifyOtpDto } from './dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** Email + password sign-up; sends a phone verification OTP. */
  @Public()
  @Throttle({ default: { limit: () => Number(process.env.REGISTER_RATE_LIMIT ?? 5), ttl: 60_000 } })
  @Post('register')
  register(@Body() dto: RegisterDto, @Headers('user-agent') ua?: string) {
    return this.auth.register(dto, ua);
  }

  @Public()
  @Throttle({ default: { limit: () => Number(process.env.LOGIN_RATE_LIMIT ?? 10), ttl: 60_000 } })
  @HttpCode(200)
  @Post('login')
  login(@Body() dto: LoginDto, @Headers('user-agent') ua?: string) {
    return this.auth.login(dto, ua);
  }

  /** Exchanges a refresh token for a new pair (the old refresh token stops working). */
  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @HttpCode(200)
  @Post('refresh')
  refresh(@Body() dto: RefreshDto, @Headers('user-agent') ua?: string) {
    return this.auth.refresh(dto.refreshToken, ua);
  }

  /** Signs out this device. */
  @Public()
  @HttpCode(200)
  @Post('logout')
  logout(@Body() dto: RefreshDto) {
    return this.auth.logout(dto.refreshToken);
  }

  /** Signs out every device (access tokens already issued expire within minutes). */
  @ApiBearerAuth()
  @HttpCode(200)
  @Post('logout-all')
  logoutAll(@CurrentUser() user: AuthUser) {
    return this.auth.logoutAll(user.id);
  }

  /** Send a 6-digit code by SMS (purpose LOGIN or VERIFY_PHONE). */
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(200)
  @Post('otp/request')
  requestOtp(@Body() dto: RequestOtpDto) {
    return this.auth.requestOtp(dto);
  }

  /** Verifies the code, marks the phone verified and returns a token. */
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(200)
  @Post('otp/verify')
  verifyOtp(@Body() dto: VerifyOtpDto, @Headers('user-agent') ua?: string) {
    return this.auth.verifyOtp(dto, ua);
  }

  @ApiBearerAuth()
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.id);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateMeDto) {
    return this.auth.updateMe(user.id, dto);
  }
}
