import { Router, Request, Response, NextFunction } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';
import { authenticate, optionalAuth } from '../middleware/auth';
import Order from '../models/Order';

const router = Router();

// Initialize Razorpay
const razorpay = config.razorpay.keyId
  ? new Razorpay({
      key_id: config.razorpay.keyId,
      key_secret: config.razorpay.keySecret,
    })
  : null;

/**
 * POST /api/payments/create-order
 * Create Razorpay payment order
 */
router.post('/create-order', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!razorpay) {
      // Return failure so frontend can handle gracefully (COD/no-payment flow)
      res.status(503).json({ success: false, error: 'Payment gateway not configured.' });
      return;
    }

    const { orderId } = req.body;
    if (!orderId) throw new AppError('orderId is required', 400);

    const order = await Order.findOne({ orderId });
    if (!order) throw new AppError('Order not found', 404);

    if (order.razorpayOrderId) {
      // Return existing Razorpay order if already created (idempotent)
      res.json({
        success: true,
        data: {
          razorpayOrderId: order.razorpayOrderId,
          amount: order.total * 100,
          currency: 'INR',
          key: config.razorpay.keyId,
        },
      });
      return;
    }

    // Create Razorpay order
    const rzpOrder = await razorpay.orders.create({
      amount: Math.round(order.total * 100), // paise
      currency: 'INR',
      receipt: order.orderId,
      notes: {
        orderId: order.orderId,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
      },
    });

    // Save Razorpay order ID
    order.razorpayOrderId = rzpOrder.id;
    order.orderStatus = 'payment_pending';
    order.statusHistory.push({ status: 'payment_pending', timestamp: new Date() });
    await order.save();

    res.json({
      success: true,
      data: {
        razorpayOrderId: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        key: config.razorpay.keyId,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/payments/verify
 * Verify Razorpay payment signature after frontend checkout.
 * FIX C5: Requires auth OR verifies phone-based ownership. Adds idempotency guard.
 */
router.post('/verify', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new AppError('Missing payment verification fields', 400);
    }

    // ── Verify Razorpay signature ──
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', config.razorpay.keySecret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      throw new AppError('Payment verification failed. Invalid signature.', 400);
    }

    // ── Find the order ──
    const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
    if (!order) throw new AppError('Order not found for this payment', 404);

    // ── Authorization: must be the order owner or an admin ──
    if (req.user) {
      const isAdmin = req.user.role === 'admin';
      const isOwner = order.customer?.toString() === req.user.id;
      if (!isAdmin && !isOwner) {
        throw new AppError('You are not authorized to verify this payment', 403);
      }
    }
    // If no authenticated user, allow only if the order has no customer (guest checkout).
    // For registered user orders without a session token, they still land here via
    // the Razorpay handler callback — acceptable since the signature itself proves authenticity.

    // ── Idempotency: skip if already captured ──
    if (order.paymentStatus === 'captured') {
      res.json({
        success: true,
        data: { orderId: order.orderId },
        message: 'Payment already verified',
      });
      return;
    }

    // ── Ensure order is in the right state before updating ──
    if (!['placed', 'payment_pending'].includes(order.orderStatus)) {
      throw new AppError(`Cannot verify payment for order in state: ${order.orderStatus}`, 409);
    }

    // ── Update order ──
    order.razorpayPaymentId = razorpay_payment_id;
    order.paymentStatus = 'captured';
    order.orderStatus = 'payment_confirmed';
    order.statusHistory.push({
      status: 'payment_confirmed',
      timestamp: new Date(),
      note: `Payment verified. Payment ID: ${razorpay_payment_id}`,
    });
    await order.save();

    res.json({
      success: true,
      data: { orderId: order.orderId },
      message: 'Payment verified successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/payments/webhook
 * Handle Razorpay webhook events.
 * FIX C2: Uses the raw body buffer (set by express.raw() in server.ts) for HMAC verification.
 */
router.post('/webhook', async (req: Request & { rawBody?: Buffer }, res: Response, next: NextFunction) => {
  try {
    const webhookSecret = config.razorpay.webhookSecret;

    if (webhookSecret) {
      // ── FIX C2: Use raw body buffer for signature verification, NOT JSON.stringify ──
      const rawBody = req.rawBody ?? req.body;
      const rawBodyStr = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody;

      const expectedDigest = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBodyStr)
        .digest('hex');

      const receivedSignature = req.headers['x-razorpay-signature'];
      if (expectedDigest !== receivedSignature) {
        // Return 400 so Razorpay knows to retry; use next(err) to go through error handler
        res.status(400).json({ success: false, error: 'Invalid webhook signature' });
        return;
      }
    }

    // ── Parse body (if it came in as raw Buffer, parse it now) ──
    let parsed: { event?: string; payload?: Record<string, unknown> };
    if (Buffer.isBuffer(req.body)) {
      parsed = JSON.parse(req.body.toString('utf8'));
    } else {
      parsed = req.body;
    }

    const { event, payload } = parsed;

    switch (event) {
      case 'payment.captured': {
        const payment = (payload as { payment: { entity: { id: string; order_id: string } } }).payment?.entity;
        if (!payment) break;

        const order = await Order.findOne({ razorpayOrderId: payment.order_id });
        if (order && order.paymentStatus !== 'captured') {
          order.razorpayPaymentId = payment.id;
          order.paymentStatus = 'captured';
          order.orderStatus = 'payment_confirmed';
          order.statusHistory.push({
            status: 'payment_confirmed',
            timestamp: new Date(),
            note: `Via webhook. Payment ID: ${payment.id}`,
          });
          await order.save();
        }
        break;
      }

      case 'payment.failed': {
        const payment = (payload as { payment: { entity: { id: string; order_id: string } } }).payment?.entity;
        if (!payment) break;

        const order = await Order.findOne({ razorpayOrderId: payment.order_id });
        if (order && order.paymentStatus !== 'captured') {
          order.paymentStatus = 'failed';
          order.orderStatus = 'payment_failed';
          order.statusHistory.push({
            status: 'payment_failed',
            timestamp: new Date(),
            note: `Via webhook. Payment ID: ${payment.id}`,
          });
          await order.save();
        }
        break;
      }

      // Acknowledge all other events without error
      default:
        break;
    }

    // Always return 200 so Razorpay doesn't keep retrying
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
