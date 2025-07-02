export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  appUrl: process.env.APP_URL,
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    url: process.env.REDIS_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
  session: {
    secret: process.env.SESSION_SECRET,
  },
  email: {
    apiKey: process.env.RESEND_API_KEY,
    fromEmail: process.env.RESEND_FROM_EMAIL,
    fromName: process.env.RESEND_FROM_NAME,
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
  throttler: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60', 10), // seconds
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10), // requests per TTL
    authTtl: parseInt(process.env.THROTTLE_AUTH_TTL || '300', 10), // seconds for auth endpoints
    authLimit: parseInt(process.env.THROTTLE_AUTH_LIMIT || '10', 10), // requests per TTL for auth endpoints
    paymentTtl: parseInt(process.env.THROTTLE_PAYMENT_TTL || '60', 10), // seconds for payment endpoints
    paymentLimit: parseInt(process.env.THROTTLE_PAYMENT_LIMIT || '20', 10), // requests per TTL for payment endpoints
    uploadTtl: parseInt(process.env.THROTTLE_UPLOAD_TTL || '60', 10), // seconds for upload endpoints
    uploadLimit: parseInt(process.env.THROTTLE_UPLOAD_LIMIT || '10', 10), // requests per TTL for upload endpoints
  },
  digitalOcean: {
    spaces: {
      accessKeyId: process.env.DO_SPACES_ACCESS_KEY_ID,
      secretAccessKey: process.env.DO_SPACES_SECRET_ACCESS_KEY,
      endpoint: process.env.DO_SPACES_ENDPOINT,
      region: process.env.DO_SPACES_REGION,
      bucket: process.env.DO_SPACES_BUCKET,
      cdnUrl: process.env.DO_SPACES_CDN_URL, // Optional CDN URL for faster file serving
    },
  },
  files: {
    maxSize: parseInt(process.env.FILE_MAX_SIZE || '10485760', 10), // 10MB default
    allowedMimeTypes: process.env.FILE_ALLOWED_MIME_TYPES?.split(',') || [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
    ],
    allowedExtensions: process.env.FILE_ALLOWED_EXTENSIONS?.split(',') || [
      '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv',
    ],
  },
});
