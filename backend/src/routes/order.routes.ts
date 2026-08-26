import { Router, Request, Response, NextFunction } from 'express';
import { validateBody } from '../middleware/validate';
import { authenticate, optionalAuth } from '../middleware/auth';
import { createOrderSchema, updateOrderStatusSchema } from '../validators';
import { AppError } from '../middleware/errorHandler';
import Order, { VALID_TRANSITIONS, OrderStatus } from '../models/Order';
import { config } from '../config';
import { notifyNewOrder } from '../services/whatsapp';

const router = Router();

/**
 * POST /api/orders
 * Create a new order (guest or authenticated)
 */
router.post('/', optionalAuth, validateBody(createOrderSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { items, orderType, deliveryAddress, customerName, customerPhone, customerEmail, couponCode, notes, scheduledTime } = req.body;

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: { unitPrice: number; quantity: number }) => sum + item.unitPrice * item.quantity, 0);

    // Validate minimum order
    if (subtotal < config.business.minOrderAmount) {
      throw new AppError(`Minimum order amount is ₹${config.business.minOrderAmount}`, 400);
    }

    // Delivery fee
    let deliveryFee = 0;
    if (orderType === 'delivery') {
      deliveryFee = subtotal >= config.business.freeDeliveryThreshold ? 0 : config.business.deliveryCharge;
      if (!deliveryAddress) {
        throw new AppError('Delivery address is required for delivery orders', 400);
      }
    }

    // TODO: Validate coupon and calculate discount
    const discount = 0;
    const total = subtotal + deliveryFee - discount;

    const orderItems = items.map((item: {
      productId: string; productName: string; variantName: string;
      unitPrice: number; quantity: number; image: string; isVeg: boolean;
    }) => ({
      productId: item.productId,
      productName: item.productName,
      variantName: item.variantName,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      subtotal: item.unitPrice * item.quantity,
      image: item.image,
      isVeg: item.isVeg,
    }));

    const order = await Order.create({
      customer: req.user?.id || undefined,
      customerName,
      customerPhone,
      customerEmail,
      items: orderItems,
      orderType,
      deliveryAddress: orderType === 'delivery' ? deliveryAddress : undefined,
      scheduledTime: scheduledTime ? new Date(scheduledTime) : undefined,
      subtotal,
      deliveryFee,
      discount,
      total,
      couponCode,
      notes,
      orderStatus: 'placed',
      paymentStatus: 'pending',
      statusHistory: [{ status: 'placed', timestamp: new Date() }],
    });

    // Notify kitchen owner via WhatsApp
    try {
      notifyNewOrder({
        orderId: order.orderId,
        customerName,
        customerPhone,
        orderType,
        total,
        items: orderItems,
        deliveryAddress: orderType === 'delivery' ? deliveryAddress : undefined,
      });
    } catch (whatsappError) {
      console.error('WhatsApp notification failed (non-blocking):', whatsappError);
    }

    res.status(201).json({
      success: true,
      data: order.toJSON(),
      message: 'Order placed successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/orders/my-orders
 * Get authenticated user's orders
 */
router.get('/my-orders', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '10' } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

    const [orders, total] = await Promise.all([
      Order.find({ customer: req.user!.id })
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Order.countDocuments({ customer: req.user!.id }),
    ]);

    res.json({
      success: true,
      data: {
        orders,
        pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/orders/:orderId
 * Get order by orderId (authenticated user or guest by orderId)
 */
router.get('/:orderId', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) throw new AppError('Order not found', 404);

    // Security: only the order owner or admin can view
    if (req.user && req.user.role !== 'admin' && order.customer?.toString() !== req.user.id) {
      throw new AppError('Access denied', 403);
    }

    res.json({ success: true, data: order.toJSON() });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/orders/:orderId/status
 * Update order status (admin only, enforces valid transitions)
 */
router.patch('/:orderId/status', authenticate, validateBody(updateOrderStatusSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user!.role !== 'admin') {
      throw new AppError('Admin access required', 403);
    }

    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) throw new AppError('Order not found', 404);

    const { status, note } = req.body as { status: OrderStatus; note?: string };

    // Validate status transition
    const allowed = VALID_TRANSITIONS[order.orderStatus];
    if (!allowed.includes(status)) {
      throw new AppError(
        `Cannot transition from "${order.orderStatus}" to "${status}". Allowed: ${allowed.join(', ')}`,
        400
      );
    }

    order.orderStatus = status;
    order.statusHistory.push({ status, timestamp: new Date(), note });

    // Auto-update payment status based on order status
    if (status === 'cancelled' && order.paymentStatus === 'captured') {
      order.paymentStatus = 'refund_pending';
    }

    await order.save();

    res.json({
      success: true,
      data: order.toJSON(),
      message: `Order status updated to "${status}"`,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
