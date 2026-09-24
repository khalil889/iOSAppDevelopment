export interface AppConfig {
  port: number;
  databaseUrl: string;
  runMigrations: boolean;
  jwt: { secret: string; expiresIn: string };
  corsOrigins: string[];
  otp: { ttlSeconds: number; maxAttempts: number; devEcho: boolean };
  providers: { sms: string; payment: string; kyc: string; ai: string; storage: string };
  publicApiUrl: string;
  storage: { uploadDir: string };
  s3: {
    bucket: string;
    region: string;
    endpoint: string;
    accessKeyId: string;
    secretAccessKey: string;
    forcePathStyle: boolean;
  };
  moyasar: {
    apiUrl: string;
    secretKey: string;
    publishableKey: string;
    callbackUrl: string;
    webhookSecret: string;
  };
  mobishastra: { apiUrl: string; user: string; password: string; senderId: string };
  anthropic: { model: string; effort: 'low' | 'medium' | 'high' };
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
    storage: process.env.STORAGE_PROVIDER ?? 'local',
  },
  publicApiUrl: (process.env.PUBLIC_API_URL ?? `http://localhost:${int(process.env.PORT, 3000)}`).replace(/\/$/, ''),
  storage: { uploadDir: process.env.UPLOAD_DIR ?? 'uploads' },
  s3: {
    bucket: process.env.S3_BUCKET ?? '',
    region: process.env.S3_REGION ?? 'auto',
    endpoint: process.env.S3_ENDPOINT ?? '',
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
    forcePathStyle: bool(process.env.S3_FORCE_PATH_STYLE, false),
  },
  moyasar: {
    apiUrl: process.env.MOYASAR_API_URL ?? 'https://api.moyasar.com/v1',
    secretKey: process.env.MOYASAR_SECRET_KEY ?? '',
    publishableKey: process.env.MOYASAR_PUBLISHABLE_KEY ?? '',
    callbackUrl: process.env.MOYASAR_CALLBACK_URL ?? '',
    webhookSecret: process.env.MOYASAR_WEBHOOK_SECRET ?? '',
  },
  mobishastra: {
    apiUrl: process.env.MOBISHASTRA_API_URL ?? 'https://mshastra.com/sendurl.aspx',
    user: process.env.MOBISHASTRA_USER ?? '',
    password: process.env.MOBISHASTRA_PASSWORD ?? '',
    senderId: process.env.MOBISHASTRA_SENDER_ID ?? '',
  },
  anthropic: {
    model: process.env.ANTHROPIC_MODEL ?? 'claude-opus-5',
    effort: (['low', 'medium', 'high'].includes(process.env.ANTHROPIC_EFFORT ?? '')
      ? process.env.ANTHROPIC_EFFORT
      : 'low') as 'low' | 'medium' | 'high',
  },
  marketplace: {
    platformFeePercent: int(process.env.PLATFORM_FEE_PERCENT, 15),
    reviewWindowDays: int(process.env.REVIEW_WINDOW_DAYS, 30),
    disputeWindowDays: int(process.env.DISPUTE_WINDOW_DAYS, 7),
  },
});
