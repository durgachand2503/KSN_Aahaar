import { Router, Request, Response, NextFunction } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';
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
      throw new AppError('Payment gateway not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.', 503);
    }

    const { orderId } = req.body;
    if (!orderId) throw new AppError('orderId is required', 400);

    const order = await Order.findOne({ orderId });
    if (!order) throw new AppError('Order not found', 404);

    if (order.razorpayOrderId) {
      // Return existing Razorpay order if already created
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
 * Verify Razorpay payment signature
 */
router.post('/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new AppError('Missing payment verification fields', 400);
    }

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', config.razorpay.keySecret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      throw new AppError('Payment verification failed. Invalid signature.', 400);
    }

    // Update order
    const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
    if (!order) throw new AppError('Order not found for this payment', 404);

    order.razorpayPaymentId = razorpay_payment_id;
    order.paymentStatus = 'captured';
    order.orderStatus = 'payment_confirmed';
    order.statusHistory.push({ status: 'payment_confirmed', timestamp: new Date(), note: `Payment ID: ${razorpay_payment_id}` });
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
 * Handle Razorpay webhook events
 */
router.post('/webhook', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const webhookSecret = config.razorpay.webhookSecret;

    if (webhookSecret) {
      const shasum = crypto.createHmac('sha256', webhookSecret);
      shasum.update(JSON.stringify(req.body));
      const digest = shasum.digest('hex');

      if (digest !== req.headers['x-razorpay-signature']) {
        throw new AppError('Invalid webhook signature', 400);
      }
    }

    const event = req.body.event;
    const payload = req.body.payload;

    switch (event) {
      case 'payment.captured': {
        const paymentId = payload.payment.entity.id;
        const orderId = payload.payment.entity.order_id;

        const order = await Order.findOne({ razorpayOrderId: orderId });
        if (order && order.paymentStatus !== 'captured') {
          order.razorpayPaymentId = paymentId;
          order.paymentStatus = 'captured';
          order.orderStatus = 'payment_confirmed';
          order.statusHistory.push({ status: 'payment_confirmed', timestamp: new Date(), note: 'Via webhook' });
          await order.save();
        }
        break;
      }
      case 'payment.failed': {
        const orderId = payload.payment.entity.order_id;
        const order = await Order.findOne({ razorpayOrderId: orderId });
        if (order) {
          order.paymentStatus = 'failed';
          order.orderStatus = 'payment_failed';
          order.statusHistory.push({ status: 'payment_failed', timestamp: new Date(), note: 'Via webhook' });
          await order.save();
        }
        break;
      }
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
