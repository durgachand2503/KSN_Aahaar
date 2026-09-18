import { Router, Request, Response, NextFunction } from 'express';
import { validateBody } from '../middleware/validate';
import { authenticate, requireAdmin } from '../middleware/auth';
import { validateCouponSchema, createCouponSchema } from '../validators';
import { AppError } from '../middleware/errorHandler';
import Coupon from '../models/Coupon';

const router = Router();

/**
 * POST /api/coupons/validate
 * Validate a coupon code and return discount info
 */
router.post('/validate', validateBody(validateCouponSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, subtotal } = req.body;

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) throw new AppError('Invalid coupon code', 400);

    // Check expiry
    if (new Date() > coupon.expiryDate) {
      throw new AppError('This coupon has expired', 400);
    }

    // Check usage limit
    if (coupon.usedCount >= coupon.usageLimit) {
      throw new AppError('This coupon has been fully redeemed', 400);
    }

    // Check minimum order
    if (subtotal < coupon.minOrderAmount) {
      throw new AppError(`Minimum order of ₹${coupon.minOrderAmount} required for this coupon`, 400);
    }

    // Calculate discount
    let discountAmount: number;
    if (coupon.discountType === 'percentage') {
      discountAmount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    // Don't allow discount greater than subtotal
    discountAmount = Math.min(discountAmount, subtotal);

    res.json({
      success: true,
      data: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: Math.round(discountAmount),
        description: coupon.description,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/coupons/active
 * List all active coupons (public)
 */
router.get('/active', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const coupons = await Coupon.find({
      isActive: true,
      expiryDate: { $gt: new Date() },
      $expr: { $lt: ['$usedCount', '$usageLimit'] },
    }).select('code discountType discountValue minOrderAmount maxDiscount description');

    res.json({ success: true, data: coupons });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/coupons (Admin only)
 */
router.post('/', authenticate, requireAdmin, validateBody(createCouponSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await Coupon.findOne({ code: req.body.code.toUpperCase() });
    if (existing) throw new AppError('Coupon code already exists', 409);

    const coupon = await Coupon.create({
      ...req.body,
      code: req.body.code.toUpperCase(),
      expiryDate: new Date(req.body.expiryDate),
    });

    res.status(201).json({ success: true, data: coupon.toJSON(), message: 'Coupon created' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/coupons (Admin only — all coupons)
 */
router.get('/', authenticate, requireAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, data: coupons });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/coupons/:id (Admin only)
 */
router.delete('/:id', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) throw new AppError('Coupon not found', 404);
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/coupons/:id/toggle (Admin only)
 * Toggle the isActive flag on a coupon
 */
router.patch('/:id/toggle', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) throw new AppError('Coupon not found', 404);
    coupon.isActive = !coupon.isActive;
    await coupon.save();
    res.json({ success: true, data: coupon.toJSON(), message: `Coupon ${coupon.isActive ? 'activated' : 'deactivated'}` });
  } catch (error) {
    next(error);
  }
});

export default router;
