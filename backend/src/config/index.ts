import dotenv from 'dotenv';
dotenv.config();

/* ═══════════════════════════════════════════════════════════════
   KSN AAHAAR — Startup Environment Validation

   Required variables MUST be set. Missing any will crash the
   server with a clear error rather than silently using defaults.
   ═══════════════════════════════════════════════════════════════ */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[FATAL] Missing required environment variable: ${name}\n` +
      `  Copy backend/.env.example → backend/.env and fill in all values.`
    );
  }
  return value;
}

// ── In production, require all critical secrets ──
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  // These MUST be set in production — fail fast if missing
  requireEnv('MONGO_URI');
  requireEnv('JWT_SECRET');
  requireEnv('CORS_ORIGIN');
}

// ── JWT secret: dev fallback is clearly labeled and never used in prod ──
// In development, a warning is printed if the default is used.
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  if (isProduction) {
    throw new Error('[FATAL] JWT_SECRET is required in production.');
  }
  console.warn(
    '\n⚠️  [Config] JWT_SECRET not set. Using an insecure development default.\n' +
    '   Set JWT_SECRET in your .env file for any real deployment.\n'
  );
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // MongoDB — no default in production; dev gets localhost convenience default
  mongoUri: isProduction
    ? requireEnv('MONGO_URI')
    : (process.env.MONGO_URI || 'mongodb://localhost:27017/ksn-aahaar'),

  // JWT — no hardcoded default in production
  jwtSecret: jwtSecret || 'ksn-aahaar-local-dev-only-NOT-for-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // Razorpay (optional — leave empty to run without online payments)
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  },

  // CORS — no default in production; dev gets localhost convenience default
  corsOrigin: isProduction
    ? requireEnv('CORS_ORIGIN')
    : (process.env.CORS_ORIGIN || 'http://localhost:3000'),

  // Rate limiting
  rateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),

  // WhatsApp
  whatsapp: {
    ownerPhone: process.env.WHATSAPP_OWNER_PHONE || '',
  },

  // Email (Nodemailer / Gmail)
  email: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    to:   process.env.EMAIL_TO   || process.env.EMAIL_USER || '',
  },

  // Frontend URL (used in email templates)
  // Must be set to the deployed frontend URL in production.
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Business defaults (non-sensitive, safe to hardcode)
  business: {
    deliveryRadius: 10, // km
    deliveryCharge: 30,
    freeDeliveryThreshold: 500,
    minOrderAmount: 199,
    defaultEstimatedTime: '30-45 min',
  },
};
