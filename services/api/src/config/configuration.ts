export interface AppConfig {
  port: number;
  databaseUrl: string;
  runMigrations: boolean;
  jwt: { secret: string; accessTtlSeconds: number; refreshTtlDays: number };
  isProduction: boolean;
  trustProxy: boolean;
  logFormat: 'json' | 'text';
  loginLockout: { maxAttempts: number; minutes: number };
  corsOrigins: string[];
  otp: { ttlSeconds: number; maxAttempts: number; devEcho: boolean; allowedPrefixes: string[] };
  providers: { sms: string; payment: string; kyc: string; identity: string; ai: string; storage: string; push: string };
  /** 32-byte key (base64 or hex) that encrypts guides' bank details. */
  payoutEncKey: string;
  sumsub: { apiUrl: string; appToken: string; secretKey: string; webhookSecret: string; levelName: string };
  firebase: { serviceAccount: string };
  publicApiUrl: string;
  /** E.164 numbers texted on every SOS alert. */
  opsAlertPhones: string[];
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
    accessTtlSeconds: int(process.env.JWT_ACCESS_TTL_SECONDS, 900),
    refreshTtlDays: int(process.env.JWT_REFRESH_TTL_DAYS, 30),
  },
  isProduction: process.env.NODE_ENV === 'production',
  trustProxy: bool(process.env.TRUST_PROXY, false),
  logFormat: process.env.LOG_FORMAT === 'json' ? 'json' : 'text',
  loginLockout: {
    maxAttempts: int(process.env.LOGIN_MAX_ATTEMPTS, 5),
    minutes: int(process.env.LOGIN_LOCKOUT_MINUTES, 15),
  },
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3001')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  otp: {
    ttlSeconds: int(process.env.OTP_TTL_SECONDS, 300),
    maxAttempts: int(process.env.OTP_MAX_ATTEMPTS, 5),
    // Never echo codes in production, whatever the env says.
    devEcho: process.env.NODE_ENV !== 'production' && bool(process.env.OTP_DEV_ECHO, false),
    // e.g. "+966,+971,+20,+962"; empty = any country
    allowedPrefixes: (process.env.SMS_ALLOWED_PREFIXES ?? '').split(',').map((p) => p.trim()).filter(Boolean),
  },
  providers: {
    sms: process.env.SMS_PROVIDER ?? 'stub',
    payment: process.env.PAYMENT_PROVIDER ?? 'stub',
    kyc: process.env.KYC_PROVIDER ?? 'stub',
    identity: process.env.IDENTITY_PROVIDER ?? 'stub',
    ai: process.env.AI_PROVIDER ?? 'stub',
    storage: process.env.STORAGE_PROVIDER ?? 'local',
    push: process.env.PUSH_PROVIDER ?? 'stub',
  },
  firebase: { serviceAccount: process.env.FIREBASE_SERVICE_ACCOUNT ?? '' },
  payoutEncKey: process.env.PAYOUT_ENC_KEY ?? 'dev-only-payout-key',
  sumsub: {
    apiUrl: (process.env.SUMSUB_API_URL ?? 'https://api.sumsub.com').replace(/\/$/, ''),
    appToken: process.env.SUMSUB_APP_TOKEN ?? '',
    secretKey: process.env.SUMSUB_SECRET_KEY ?? '',
    webhookSecret: process.env.SUMSUB_WEBHOOK_SECRET ?? '',
    levelName: process.env.SUMSUB_LEVEL_NAME ?? 'id-and-liveness',
  },
  publicApiUrl: (process.env.PUBLIC_API_URL ?? `http://localhost:${int(process.env.PORT, 3000)}`).replace(/\/$/, ''),
  opsAlertPhones: (process.env.OPS_ALERT_PHONES ?? '').split(',').map((p) => p.trim()).filter(Boolean),
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
