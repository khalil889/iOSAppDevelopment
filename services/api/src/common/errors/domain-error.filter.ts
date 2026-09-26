import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import { domainErrorAr } from '../i18n/error-messages.ar';
import { langFromHeader } from '../i18n/lang';
import { DomainError, DomainErrorKind } from './domain-error';

const STATUS: Record<DomainErrorKind, number> = {
  validation: HttpStatus.UNPROCESSABLE_ENTITY,
  forbidden: HttpStatus.FORBIDDEN,
  not_found: HttpStatus.NOT_FOUND,
  conflict: HttpStatus.CONFLICT,
};

@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter {
  catch(error: DomainError, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const res = http.getResponse<Response>();
    const arabic = langFromHeader(http.getRequest<Request>().headers['accept-language']) === 'ar';
    const statusCode = STATUS[error.kind];
    res.status(statusCode).json({
      statusCode,
      error: error.code,
      message: (arabic && domainErrorAr(error.code, error.message)) || error.message,
    });
  }
}
