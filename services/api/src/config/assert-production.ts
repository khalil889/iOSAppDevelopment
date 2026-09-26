import { AppConfig } from './configuration';

/**
 * Refuses to start in production with settings that are only safe for local
 * development. Returns the list of problems (empty = OK) so it can be tested.
 */
export function productionConfigProblems(c: AppConfig, env: NodeJS.ProcessEnv = process.env): string[] {
  if (!c.isProduction) return [];
  const problems: string[] = [];
  if (!env.JWT_SECRET || env.JWT_SECRET.length < 32 || env.JWT_SECRET.startsWith('change-me')) {
    problems.push('JWT_SECRET must be set to a random string of at least 32 characters');
  }
  if (c.providers.payment === 'stub') problems.push('PAYMENT_PROVIDER=stub accepts fake payments');
  if (c.providers.sms === 'stub') problems.push('SMS_PROVIDER=stub never delivers OTP codes (and logs them)');
  if (c.providers.payment === 'moyasar' && !c.moyasar.webhookSecret) problems.push('MOYASAR_WEBHOOK_SECRET is required');
  if (c.providers.storage === 'local') problems.push('STORAGE_PROVIDER=local keeps documents on one server; use s3');
  if (c.corsOrigins.some((o) => o.includes('localhost'))) problems.push('CORS_ORIGINS must not include localhost');
  if (!c.publicApiUrl.startsWith('https://')) problems.push('PUBLIC_API_URL must be https');
  return problems;
}
