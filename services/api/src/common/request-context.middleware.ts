import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { langFromHeader, runWithLang } from './i18n/lang';

/**
 * Tags every request with an id (reusing a sane incoming X-Request-Id from a
 * proxy), echoes it back, and logs one line per request with status and
 * latency. Bodies, tokens and query strings are never logged.
 */
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request & { id?: string; user?: { id: string } }, res: Response, next: NextFunction) {
    const incoming = req.headers['x-request-id'];
    const id = typeof incoming === 'string' && /^[\w-]{8,64}$/.test(incoming) ? incoming : randomUUID();
    req.id = id;
    res.setHeader('x-request-id', id);
    const started = process.hrtime.bigint();

    res.on('finish', () => {
      const ms = Number(process.hrtime.bigint() - started) / 1e6;
      const path = req.originalUrl.split('?')[0];
      if (path.endsWith('/health') || path.endsWith('/health/live')) return;
      const line = `${req.method} ${path} ${res.statusCode} ${ms.toFixed(0)}ms id=${id}${req.user ? ` user=${req.user.id}` : ''}`;
      if (res.statusCode >= 500) this.logger.error(line);
      else if (res.statusCode >= 400) this.logger.warn(line);
      else this.logger.log(line);
    });
    // Services (SMS, assistant) read the request language via currentLang().
    runWithLang(langFromHeader(req.headers['accept-language']), next);
  }
}
