import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { connectDB } from './config/db';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Route imports
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import orderRoutes from './routes/order.routes';
import paymentRoutes from './routes/payment.routes';
import couponRoutes from './routes/coupon.routes';
import settingsRoutes from './routes/settings.routes';
import adminRoutes from './routes/admin.routes';
import contactRoutes from './routes/contact.routes';

const app = express();

// ── Trust proxy (for rate limiting behind reverse proxy) ──
app.set('trust proxy', 1);

// ── Security ──
app.use(helmet({ contentSecurityPolicy: false }));
app.disable('x-powered-by');
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Rate Limiting ──
const globalLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
});

// Stricter limiter for auth endpoints (brute-force protection)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many authentication attempts. Please wait 15 minutes before trying again.' },
});

// Stricter limiter for payment endpoints
export const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many payment requests. Please try again later.' },
});

// Very strict limiter for admin login only (brute-force protection)
// NOTE: This ONLY applies to the login route — not the rest of the admin API.
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 login attempts per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many admin login attempts. Please wait 15 minutes.' },
  skipSuccessfulRequests: true,
});

app.use(globalLimiter);

// ── Static Files (uploaded images) ──
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

// ── CRITICAL: Razorpay webhook MUST receive the raw body for HMAC verification.
//    This route is registered BEFORE express.json() so it gets the raw Buffer.
//    The rawBody is attached to req for the route handler.
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// ── Body Parsing (registered AFTER the raw webhook route) ──
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Request Logging ──
if (config.nodeEnv !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ── Health Check ──
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'KSN AAHAAR API is running',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ──
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentLimiter, paymentRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/settings', settingsRoutes);
// Admin login gets the strict brute-force limiter; all other admin routes use globalLimiter (already applied above)
app.use('/api/admin/login', adminLimiter);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);

// ── Error Handling ──
app.use(notFoundHandler);
app.use(errorHandler);

// ── Start Server ──
async function startServer() {
  await connectDB();
  
  app.listen(config.port, () => {
    console.log(`
╔═══════════════════════════════════════════╗
║    KSN AAHAAR Backend API                 ║
║    Port: ${config.port}                   ║
║    Env:  ${config.nodeEnv.padEnd(31)}     ║
╚═══════════════════════════════════════════╝
    `);
  });
}

startServer().catch(console.error);

export default app;
