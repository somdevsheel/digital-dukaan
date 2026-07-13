// Typed accessor shape for ConfigService.getOrThrow<T>("path") calls elsewhere —
// grouping raw process.env reads here means no other file in the app touches
// process.env directly.
export default () => ({
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parseInt(process.env.PORT ?? "4000", 10),

  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,

  meilisearch: {
    host: process.env.MEILISEARCH_HOST,
    apiKey: process.env.MEILISEARCH_API_KEY,
  },

  storage: {
    endpoint: process.env.STORAGE_ENDPOINT,
    publicBaseUrl: process.env.STORAGE_PUBLIC_BASE_URL,
    accessKeyId: process.env.STORAGE_ACCESS_KEY_ID,
    secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY,
    bucket: process.env.STORAGE_BUCKET,
  },

  fieldEncryptionKey: process.env.FIELD_ENCRYPTION_KEY,

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessTtl: process.env.JWT_ACCESS_TTL ?? "15m",
    refreshTtl: process.env.JWT_REFRESH_TTL ?? "30d",
  },

  googleOAuth: {
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  },

  razorpay: {
    // Defaults to the real gateway (today's only behavior) so an unset var in production
    // never silently stops collecting real payments. Set to "mock" for local dev — see
    // MockPaymentGatewayAdapter's doc comment — since a placeholder Razorpay key/secret
    // makes every real API call fail anyway.
    provider: process.env.PAYMENT_PROVIDER ?? "razorpay",
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
  },

  sms: {
    provider: process.env.SMS_PROVIDER ?? "console",
    apiKey: process.env.SMS_API_KEY,
  },

  resendApiKey: process.env.RESEND_API_KEY,
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
});
