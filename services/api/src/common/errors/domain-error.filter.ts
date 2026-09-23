import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
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
    const res = host.switchToHttp().getResponse<Response>();
    const statusCode = STATUS[error.kind];
    res.status(statusCode).json({
      statusCode,
      error: error.code,
      message: error.message,
    });
  }
}
