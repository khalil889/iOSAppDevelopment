import { CallHandler, ExecutionContext, Injectable, NestInterceptor, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { map } from 'rxjs';
import { langFromHeader } from './lang';
import { localizeContent } from './localize';

const RAW_CONTENT = 'rawContent';

/** Opt out of content translation, e.g. for edit forms that need both languages. */
export const RawContent = () => SetMetadata(RAW_CONTENT, true);

/** Sends Arabic names/titles/descriptions to clients that ask for Arabic. */
@Injectable()
export class LocalizeInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(ctx: ExecutionContext, next: CallHandler) {
    if (ctx.getType() !== 'http') return next.handle();
    const lang = langFromHeader(ctx.switchToHttp().getRequest().headers['accept-language']);
    const raw = this.reflector.getAllAndOverride<boolean>(RAW_CONTENT, [ctx.getHandler(), ctx.getClass()]);
    if (lang === 'en' || raw) return next.handle();
    return next.handle().pipe(map((body) => localizeContent(body, lang)));
  }
}
