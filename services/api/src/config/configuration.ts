export interface AppConfig {
  port: number;
  databaseUrl: string;
  runMigrations: boolean;
  jwt: { secret: string; expiresIn: string };
  corsOrigins: string[];
  otp: { ttlSeconds: number; maxAttempts: number; devEcho: boolean };
  providers: { sms: string; payment: string; kyc: string; ai: string };
  marketplace: {
    platformFeePercent: number;
    reviewWindowDays: number;
    disputeWindowDays: number;
  };
}

const bool = (v: string | undefined, fallback = false) =>
  v === undefined ? fallback : ['1', 'true', 'yes'].includes(v.toLowerCase());

const int = (v: string | undefined, fallback: number) => {
  const n = Number.parseInt(v ?? '', 10);
  return Number.isFinite(n) ? n : fallback;
};

export default (): AppConfig => ({
  port: int(process.env.PORT, 3000),
  databaseUrl:
    process.env.DATABASE_URL ??
    'postgres://tourguide:tourguide@localhost:5432/tourguide',
  runMigrations: bool(process.env.DB_RUN_MIGRATIONS, true),
  jwt: {
    secret: process.env.JWT_SECRET ?? 'dev-only-secret',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3001')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  otp: {
    ttlSeconds: int(process.env.OTP_TTL_SECONDS, 300),
    maxAttempts: int(process.env.OTP_MAX_ATTEMPTS, 5),
    devEcho: bool(process.env.OTP_DEV_ECHO, false),
  },
  providers: {
    sms: process.env.SMS_PROVIDER ?? 'stub',
    payment: process.env.PAYMENT_PROVIDER ?? 'stub',
    kyc: process.env.KYC_PROVIDER ?? 'stub',
    ai: process.env.AI_PROVIDER ?? 'stub',
  },
  marketplace: {
    platformFeePercent: int(process.env.PLATFORM_FEE_PERCENT, 15),
    reviewWindowDays: int(process.env.REVIEW_WINDOW_DAYS, 30),
    disputeWindowDays: int(process.env.DISPUTE_WINDOW_DAYS, 7),
  },
});
