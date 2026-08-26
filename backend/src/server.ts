import express from 'express';
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

const app = express();

// ── Trust proxy (for rate limiting behind reverse proxy) ──
app.set('trust proxy', 1);

// ── Security ──
app.use(helmet());
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Rate Limiting ──
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
});
app.use(limiter);

// ── Body Parsing ──
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
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin', adminRoutes);

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
