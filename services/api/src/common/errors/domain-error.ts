/**
 * Business-rule violation raised by pure domain code (e.g. booking.rules.ts).
 * Kept framework-free so rules can be unit tested without Nest; the
 * DomainErrorFilter maps `kind` to an HTTP status.
 */
export type DomainErrorKind =
  | 'validation'
  | 'forbidden'
  | 'not_found'
  | 'conflict';

export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly kind: DomainErrorKind = 'validation',
  ) {
    super(message);
    this.name = 'DomainError';
  }
}
