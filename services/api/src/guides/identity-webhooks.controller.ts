import { Controller, Headers, HttpCode, Post, RawBodyRequest, Req } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { IdentityService } from './identity.service';

/** Identity provider callbacks, authenticated by their HMAC signature. */
@ApiExcludeController()
@Controller('identity/webhooks')
export class IdentityWebhooksController {
  constructor(private readonly identity: IdentityService) {}

  @Public()
  @SkipThrottle()
  @HttpCode(200)
  @Post('sumsub')
  sumsub(@Req() req: RawBodyRequest<Request>, @Headers() headers: Record<string, string>) {
    return this.identity.handleWebhook(req.rawBody, headers);
  }
}
