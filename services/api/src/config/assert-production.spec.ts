import configuration from './configuration';
import { productionConfigProblems } from './assert-production';

const withEnv = (env: Record<string, string>) => {
  const saved = { ...process.env };
  Object.assign(process.env, env);
  try {
    return productionConfigProblems(configuration(), process.env);
  } finally {
    process.env = saved;
  }
};

describe('productionConfigProblems', () => {
  it('allows anything outside production', () => {
    expect(withEnv({ NODE_ENV: 'development' })).toEqual([]);
  });

  it('flags dev defaults in production', () => {
    const problems = withEnv({ NODE_ENV: 'production', JWT_SECRET: 'short' });
    expect(problems.join('\n')).toMatch(/JWT_SECRET/);
    expect(problems.join('\n')).toMatch(/PAYMENT_PROVIDER=stub/);
    expect(problems.join('\n')).toMatch(/STORAGE_PROVIDER=local/);
  });

  it('passes a production-shaped config', () => {
    expect(
      withEnv({
        NODE_ENV: 'production',
        JWT_SECRET: 'x'.repeat(48),
        PAYMENT_PROVIDER: 'moyasar',
        MOYASAR_WEBHOOK_SECRET: 'whsec',
        SMS_PROVIDER: 'mobishastra',
        STORAGE_PROVIDER: 's3',
        CORS_ORIGINS: 'https://admin.tourguide.sa',
        PUBLIC_API_URL: 'https://api.tourguide.sa',
      }),
    ).toEqual([]);
  });

  it('requires a Moyasar webhook secret', () => {
    const problems = withEnv({ NODE_ENV: 'production', PAYMENT_PROVIDER: 'moyasar', MOYASAR_WEBHOOK_SECRET: '' });
    expect(problems).toContain('MOYASAR_WEBHOOK_SECRET is required');
  });

  it('never echoes OTP codes in production', () => {
    const saved = { ...process.env };
    Object.assign(process.env, { NODE_ENV: 'production', OTP_DEV_ECHO: 'true' });
    try {
      expect(configuration().otp.devEcho).toBe(false);
    } finally {
      process.env = saved;
    }
  });
});
