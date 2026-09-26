// The e2e suite signs in many times from one IP; keep the per-IP login rate
// limit out of the way so tests exercise the account lockout itself.
process.env.LOGIN_RATE_LIMIT = '1000';
process.env.OTP_DEV_ECHO = process.env.OTP_DEV_ECHO ?? 'true';
