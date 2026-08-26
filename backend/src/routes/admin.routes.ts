import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { generateToken } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { adminLoginSchema, createProductSchema, createCouponSchema } from '../validators';
import { AppError } from '../middleware/errorHandler';
import Admin from '../models/Admin';
import Order from '../models/Order';
import Product from '../models/Product';
import Category from '../models/Category';
import User from '../models/User';
import Coupon from '../models/Coupon';

const router = Router();

// ── Admin Auth ──

/**
 * POST /api/admin/login
 */
router.post('/login', validateBody(adminLoginSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email, isActive: true }).select('+password');
    if (!admin) throw new AppError('Invalid credentials', 401);

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) throw new AppError('Invalid credentials', 401);

    const token = generateToken({ id: String(admin._id), email: admin.email, role: 'admin' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, data: { admin: admin.toJSON(), token } });
  } catch (error) {
    next(error);
  }
});

// ── All routes below require admin auth ──
router.use(authenticate, requireAdmin);

/**
 * GET /api/admin/dashboard
 * Dashboard overview stats
 */
router.get('/dashboard', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      todayOrders,
      pendingOrders,
      totalRevenue,
      todayRevenue,
      totalCustomers,
      totalProducts,
      activeCoupons,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.countDocuments({ orderStatus: { $in: ['placed', 'payment_confirmed', 'accepted', 'preparing', 'ready', 'out_for_delivery'] } }),
      Order.aggregate([
        { $match: { paymentStatus: 'captured' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]).then(r => r[0]?.total || 0),
      Order.aggregate([
        { $match: { paymentStatus: 'captured', createdAt: { $gte: today } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]).then(r => r[0]?.total || 0),
      User.countDocuments(),
      Product.countDocuments(),
      Coupon.countDocuments({ isActive: true, expiryDate: { $gt: new Date() } }),
    ]);

    // Recent orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('orderId customerName orderStatus paymentStatus total createdAt orderType');

    res.json({
      success: true,
      data: {
        stats: {
          totalOrders,
          todayOrders,
          pendingOrders,
          totalRevenue,
          todayRevenue,
          totalCustomers,
          totalProducts,
          activeCoupons,
        },
        recentOrders,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/orders
 * List all orders with filters
 */
router.get('/orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, page = '1', limit = '20', search } = req.query as Record<string, string>;

    const filter: Record<string, unknown> = {};
    if (status && status !== 'all') filter.orderStatus = status;
    if (search) {
      filter.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit));

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
      Order.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: { orders, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/products
 * Create a new product
 */
router.post('/products', validateBody(createProductSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categoryId, ...productData } = req.body;

    const category = await Category.findById(categoryId);
    if (!category) throw new AppError('Category not found', 404);

    // Generate slug
    const slug = productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Check for duplicate slug
    const existing = await Product.findOne({ slug });
    if (existing) throw new AppError('A product with this name already exists', 409);

    const product = await Product.create({
      ...productData,
      slug,
      category: category._id,
      categoryName: category.name,
      categorySlug: category.slug,
    });

    // Update category item count
    await Category.findByIdAndUpdate(categoryId, { $inc: { itemCount: 1 } });

    res.status(201).json({ success: true, data: product.toJSON(), message: 'Product created' });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/products/:id
 * Update a product
 */
router.put('/products/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) throw new AppError('Product not found', 404);

    res.json({ success: true, data: product.toJSON(), message: 'Product updated' });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/admin/products/:id/toggle-availability
 */
router.patch('/products/:id/toggle-availability', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) throw new AppError('Product not found', 404);

    product.isAvailable = !product.isAvailable;
    await product.save();

    res.json({ success: true, data: product.toJSON(), message: `Product ${product.isAvailable ? 'enabled' : 'disabled'}` });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/customers
 */
router.get('/customers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '20' } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit));

    const [customers, total] = await Promise.all([
      User.find().sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
      User.countDocuments(),
    ]);

    res.json({
      success: true,
      data: { customers, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
