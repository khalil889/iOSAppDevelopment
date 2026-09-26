import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { httpMessageAr } from '../i18n/error-messages.ar';
import { langFromHeader } from '../i18n/lang';

/**
 * Same response shape as Nest's default HttpException handling, with known
 * messages translated for Arabic clients. Validation message arrays pass
 * through unchanged.
 */
@Catch(HttpException)
export class HttpErrorFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const status = exception.getStatus();
    const raw = exception.getResponse();
    const body: Record<string, unknown> =
      typeof raw === 'string' ? { statusCode: status, message: raw } : { ...(raw as Record<string, unknown>) };
    if (langFromHeader(req.headers['accept-language']) === 'ar' && typeof body.message === 'string') {
      body.message = httpMessageAr(body.message) ?? body.message;
    }
    res.status(status).json(body);
  }
}
