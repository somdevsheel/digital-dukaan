// Mirrors apps/api/src/common/config/configuration.ts's shape for the subset of config
// this deployable actually needs — no HTTP/auth/storage config here, this process never
// serves a request.
export default () => ({
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,

  sms: {
    provider: process.env.SMS_PROVIDER ?? "console",
    apiKey: process.env.SMS_API_KEY,
  },
  resendApiKey: process.env.RESEND_API_KEY,
  firebaseServiceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON,

  staleOrderTimeoutMinutes: parseInt(process.env.STALE_ORDER_TIMEOUT_MINUTES ?? "15", 10),
});
