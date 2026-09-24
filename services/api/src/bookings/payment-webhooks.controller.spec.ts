import { secretMatches } from './payment-webhooks.controller';

describe('webhook secret check', () => {
  it('accepts only an exact match', () => {
    expect(secretMatches('s3cret', 's3cret')).toBe(true);
    expect(secretMatches('s3cret', 's3cre')).toBe(false);
    expect(secretMatches('s3cret', 'S3CRET')).toBe(false);
    expect(secretMatches('s3cret', undefined)).toBe(false);
    expect(secretMatches('s3cret', 123)).toBe(false);
  });

  it('rejects everything when no secret is configured', () => {
    expect(secretMatches('', '')).toBe(false);
    expect(secretMatches('', 'anything')).toBe(false);
  });
});
