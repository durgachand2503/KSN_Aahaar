import dotenv from 'dotenv';
dotenv.config();

// ── Production safety check ──
// Crash loudly rather than silently use a predictable JWT secret.
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('[FATAL] JWT_SECRET environment variable is required in production. Set it in your .env file.');
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // MongoDB
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/ksn-aahaar',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'ksn-aahaar-dev-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // Razorpay
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  },
  
  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  
  // Rate limiting
  rateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
  rateLimitMax: 100,
  
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

  // Business defaults
  business: {
    deliveryRadius: 10, // km
    deliveryCharge: 30,
    freeDeliveryThreshold: 500,
    minOrderAmount: 199,
    defaultEstimatedTime: '30-45 min',
  },
};
