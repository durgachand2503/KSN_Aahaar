import { Router, Request, Response, NextFunction } from 'express';
import { validateBody } from '../middleware/validate';
import { authenticate, optionalAuth } from '../middleware/auth';
import { createOrderSchema, updateOrderStatusSchema } from '../validators';
import { AppError } from '../middleware/errorHandler';
import Order, { VALID_TRANSITIONS, OrderStatus } from '../models/Order';
import Product from '../models/Product';
import Coupon from '../models/Coupon';
import { config } from '../config';
import { notifyNewOrder, notifyStatusUpdate } from '../services/whatsapp';
import { sendOrderConfirmationEmail, sendAdminOrderAlert, sendStatusUpdateEmail } from '../services/email';

const router = Router();

/**
 * POST /api/orders
 * Create a new order (guest or authenticated)
 */
router.post('/', optionalAuth, validateBody(createOrderSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { items, orderType, deliveryAddress, customerName, customerPhone, customerEmail, couponCode, notes, scheduledTime } = req.body;

    // ── Server-side price validation ──
    // Fetch all required products in one query
    const productIds = [...new Set(items.map((i: { productId: string }) => i.productId))];
    const dbProducts = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(dbProducts.map(p => [String(p._id), p]));

    const priceChanges: Array<{ productName: string; variantName: string; oldPrice: number; newPrice: number }> = [];
    const unavailableItems: string[] = [];

    const orderItems = items.map((item: {
      productId: string; variantId: string; productName: string; variantName: string;
      unitPrice: number; quantity: number; image: string; isVeg: boolean;
    }) => {
      const product = productMap.get(item.productId);
      if (!product) {
        unavailableItems.push(`"${item.productName}" is no longer available`);
        return null;
      }
      if (!product.isActive) {
        unavailableItems.push(`"${product.name}" has been removed from the menu`);
        return null;
      }
      if (!product.isAvailable) {
        unavailableItems.push(`"${product.name}" is currently unavailable`);
        return null;
      }

      // Find variant by _id
      const variant = product.variants.find(v => String(v._id) === item.variantId);
      if (!variant) {
        unavailableItems.push(`Variant "${item.variantName}" of "${product.name}" not found`);
        return null;
      }
      if (!variant.isAvailable) {
        unavailableItems.push(`"${item.variantName}" variant of "${product.name}" is currently unavailable`);
        return null;
      }

      // Check for price change
      if (variant.price !== item.unitPrice) {
        priceChanges.push({
          productName: product.name,
          variantName: variant.name,
          oldPrice: item.unitPrice,
          newPrice: variant.price,
        });
      }

      return {
        productId: item.productId,
        productName: product.name,
        variantName: variant.name,
        unitPrice: variant.price,          // ← Always use DB price
        quantity: item.quantity,
        subtotal: variant.price * item.quantity,
        image: product.image || item.image, // Use latest product image
        isVeg: product.isVeg,
      };
    });

    // Reject if any items are unavailable
    if (unavailableItems.length > 0) {
      res.status(422).json({
        success: false,
        error: 'Some items in your order are no longer available',
        unavailableItems,
      });
      return;
    }

    // Reject if prices changed (let frontend show the diff and re-submit)
    if (priceChanges.length > 0) {
      res.status(422).json({
        success: false,
        error: 'Prices have changed since you added items to your cart',
        priceChanges,
      });
      return;
    }

    type OrderItem = {
      productId: string; productName: string; variantName: string;
      unitPrice: number; quantity: number; subtotal: number; image: string; isVeg: boolean;
    };
    const validOrderItems = (orderItems as (OrderItem | null)[]).filter((i): i is OrderItem => i !== null);

    // Calculate totals from DB prices
    const subtotal = validOrderItems.reduce((sum: number, item: { unitPrice: number; quantity: number }) => sum + item.unitPrice * item.quantity, 0);

    // Validate minimum order
    if (subtotal < config.business.minOrderAmount) {
      throw new AppError(`Minimum order amount is ₹${config.business.minOrderAmount}`, 400);
    }

    // Delivery fee (NOTE: delivery fee is payable at delivery, not charged via payment)
    let deliveryFee = 0;
    if (orderType === 'delivery') {
      deliveryFee = subtotal >= config.business.freeDeliveryThreshold ? 0 : config.business.deliveryCharge;
      if (!deliveryAddress) {
        throw new AppError('Delivery address is required for delivery orders', 400);
      }
    }

    // ── Validate coupon and calculate discount (race-condition-safe) ──
    let discount = 0;
    let resolvedCouponCode: string | undefined = undefined;
    let couponId: string | undefined = undefined;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon && new Date() <= coupon.expiryDate && coupon.usedCount < coupon.usageLimit && subtotal >= coupon.minOrderAmount) {
        if (coupon.discountType === 'percentage') {
          discount = (subtotal * coupon.discountValue) / 100;
          if (coupon.maxDiscount && discount > coupon.maxDiscount) {
            discount = coupon.maxDiscount;
          }
        } else {
          discount = coupon.discountValue;
        }
        discount = Math.min(Math.round(discount), subtotal);
        resolvedCouponCode = coupon.code;
        couponId = String(coupon._id);
      }
    }

    // Total does NOT include delivery fee (paid at delivery)
    const total = subtotal - discount;



    const order = await Order.create({
      customer: req.user?.id || undefined,
      customerName,
      customerPhone,
      customerEmail,
      items: validOrderItems,
      orderType,
      deliveryAddress: orderType === 'delivery' ? deliveryAddress : undefined,
      scheduledTime: scheduledTime ? new Date(scheduledTime) : undefined,
      subtotal,
      deliveryFee,
      discount,
      total,
      couponCode: resolvedCouponCode,
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
        items: validOrderItems,
        deliveryAddress: orderType === 'delivery' ? deliveryAddress : undefined,
      });
    } catch (whatsappError) {
      console.error('WhatsApp notification failed (non-blocking):', whatsappError);
    }

    // Send order confirmation email to customer (non-blocking)
    if (customerEmail) {
      sendOrderConfirmationEmail({
        customerName,
        customerEmail,
        orderId: order.orderId,
        items: validOrderItems.map((i: { productName: string; variantName: string; quantity: number; subtotal: number }) => ({ productName: i.productName, variantName: i.variantName, quantity: i.quantity, subtotal: i.subtotal })),
        subtotal,
        deliveryFee,
        discount,
        total,
        orderType,
      }).catch(e => console.error('Order email failed (non-blocking):', e));
    }

    // Send admin alert email (non-blocking)
    sendAdminOrderAlert({
      orderId: order.orderId,
      customerName,
      customerPhone,
      customerEmail: customerEmail || undefined,
      orderType,
      items: validOrderItems.map((i: { productName: string; variantName: string; quantity: number; subtotal: number }) => ({
        productName: i.productName,
        variantName: i.variantName,
        quantity: i.quantity,
        subtotal: i.subtotal,
      })),
      subtotal,
      deliveryFee,
      discount,
      total,
      deliveryAddress: orderType === 'delivery' && deliveryAddress ? {
        houseFlat: deliveryAddress.houseFlat,
        street: deliveryAddress.street,
        area: deliveryAddress.area,
        city: deliveryAddress.city,
        pincode: deliveryAddress.pincode,
        instructions: deliveryAddress.instructions,
      } : undefined,
      couponCode: resolvedCouponCode || undefined,
      notes: notes || undefined,
    }).catch(e => console.error('Admin order alert failed (non-blocking):', e));

    // ── Atomically increment coupon usage (C3 fix) ──
    // Using a conditional $inc that only applies if usedCount is still below usageLimit.
    // This prevents a race condition where two simultaneous orders both pass the check
    // but both increment, exceeding the limit.
    if (resolvedCouponCode && couponId) {
      const updated = await Coupon.findOneAndUpdate(
        { _id: couponId, $expr: { $lt: ['$usedCount', '$usageLimit'] } },
        { $inc: { usedCount: 1 } }
      );
      if (!updated) {
        // Coupon was exhausted by a concurrent request — cancel and re-throw
        order.orderStatus = 'cancelled';
        order.statusHistory.push({ status: 'cancelled', timestamp: new Date(), note: 'Coupon exhausted by concurrent request' });
        await order.save();
        throw new AppError('This coupon has just been fully redeemed. Please try without a coupon.', 409);
      }
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
    // ── H5 fix: Require authentication OR phone-based guest access ──
    // Unauthenticated users should not be able to enumerate any order by guessing sequential IDs.
    if (!req.user) {
      // For guest/unauthenticated access, require the phone number to be passed as a query param.
      const guestPhone = (req.query.phone as string || '').replace(/\s/g, '');
      if (!guestPhone || order.customerPhone.replace(/\s/g, '') !== guestPhone) {
        // Return 404 (not 403) to prevent enumeration of valid order IDs
        throw new AppError('Order not found', 404);
      }
    } else {
      const isAdmin = req.user.role === 'admin';
      const isOwner = order.customer?.toString() === req.user.id;
      if (!isAdmin && !isOwner) {
        throw new AppError('Access denied', 403);
      }
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

    // Notify customer via WhatsApp deep link (logged to console for admin to tap)
    notifyStatusUpdate(order.orderId, order.customerPhone, status, order.customerName);

    // Send customer email for key status transitions (non-blocking)
    if (order.customerEmail) {
      sendStatusUpdateEmail({
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        orderId: order.orderId,
        newStatus: status,
        orderType: order.orderType,
        note,
      }).catch(e => console.error('Status email failed (non-blocking):', e));
    }

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
