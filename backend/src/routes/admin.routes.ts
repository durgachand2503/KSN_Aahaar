import { Router, Request, Response, NextFunction } from 'express';
import path from 'path';
import { authenticate, requireAdmin } from '../middleware/auth';
import { generateToken } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { adminLoginSchema, createCouponSchema } from '../validators';
import { AppError } from '../middleware/errorHandler';
import { uploadSingle, UPLOAD_DIR } from '../middleware/upload';
import { optimizeImage, deleteFile } from '../utils/imageOptimizer';
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

    res.cookie('adminToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, data: { admin: admin.toJSON(), token } });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/me
 * Verify admin session and return admin profile (used by AdminAuthContext to verify cookie)
 */
router.get('/me', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const admin = await Admin.findById(req.user!.id);
    if (!admin) throw new AppError('Admin not found', 404);
    res.json({ success: true, data: admin.toJSON() });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/logout
 * Clear the admin httpOnly cookie
 */
router.post('/logout', (_req: Request, res: Response) => {
  res.cookie('adminToken', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', expires: new Date(0) });
  res.json({ success: true, message: 'Logged out successfully' });
});

// ── All routes below require admin auth ──
router.use(authenticate, requireAdmin);


// ═══════════════════════════════════════════
// IMAGE UPLOAD
// ═══════════════════════════════════════════

/**
 * POST /api/admin/upload/image
 * Upload a product image. Returns the public URL.
 */
router.post('/upload/image', (req: Request, res: Response, next: NextFunction) => {
  uploadSingle(req, res, async (err) => {
    if (err) return next(err);
    if (!req.file) return next(new AppError('No image file provided', 400));
    try {
      const optimizedPath = await optimizeImage(req.file.path);
      const filename = path.basename(optimizedPath);
      const url = `/uploads/${filename}`;
      res.json({ success: true, data: { url, filename } });
    } catch (error) {
      next(error);
    }
  });
});

/**
 * DELETE /api/admin/upload/image
 * Delete an uploaded image by filename.
 */
router.delete('/upload/image', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filename } = req.body;
    if (!filename || typeof filename !== 'string') throw new AppError('filename is required', 400);
    // Security: no path traversal
    const safeName = path.basename(filename);
    const filePath = path.join(UPLOAD_DIR, safeName);
    deleteFile(filePath);
    res.json({ success: true, message: 'Image deleted' });
  } catch (error) {
    next(error);
  }
});

// ═══════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════

/**
 * GET /api/admin/dashboard
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
      Product.countDocuments({ isActive: true }),
      Coupon.countDocuments({ isActive: true, expiryDate: { $gt: new Date() } }),
    ]);

    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('orderId customerName orderStatus paymentStatus total createdAt orderType');

    res.json({
      success: true,
      data: {
        stats: { totalOrders, todayOrders, pendingOrders, totalRevenue, todayRevenue, totalCustomers, totalProducts, activeCoupons },
        recentOrders,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ═══════════════════════════════════════════
// PRODUCT MANAGEMENT
// ═══════════════════════════════════════════

/**
 * GET /api/admin/products
 * List all products (active + archived) with rich filters
 */
router.get('/products', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      search,
      category,
      veg,
      featured,
      bestseller,
      available,
      active = 'true',
      sort = 'displayOrder',
      page = '1',
      limit = '50',
    } = req.query as Record<string, string>;

    const filter: Record<string, unknown> = {};

    // Active/archived filter
    if (active === 'false') {
      filter.isActive = false;
    } else if (active === 'all') {
      // No filter on isActive
    } else {
      filter.isActive = true;
    }

    if (category) filter.categorySlug = category;
    if (veg === 'true') filter.isVeg = true;
    if (veg === 'false') filter.isVeg = false;
    if (featured === 'true') filter.isFeatured = true;
    if (bestseller === 'true') filter.isBestSeller = true;
    if (available === 'true') filter.isAvailable = true;
    if (available === 'false') filter.isAvailable = false;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { categoryName: { $regex: search, $options: 'i' } },
        { shortDescription: { $regex: search, $options: 'i' } },
      ];
    }

    // Sort
    let sortOption: Record<string, 1 | -1> = { displayOrder: 1, createdAt: -1 };
    switch (sort) {
      case 'name': sortOption = { name: 1 }; break;
      case 'name-desc': sortOption = { name: -1 }; break;
      case 'price-low': sortOption = { 'variants.0.price': 1 }; break;
      case 'price-high': sortOption = { 'variants.0.price': -1 }; break;
      case 'newest': sortOption = { createdAt: -1 }; break;
      case 'popular': sortOption = { popularity: -1, displayOrder: 1 }; break;
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit)));

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sortOption).skip((pageNum - 1) * limitNum).limit(limitNum),
      Product.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: { products, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/products
 * Create a new product
 */
router.post('/products', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categoryId, ...productData } = req.body;
    if (!categoryId) throw new AppError('categoryId is required', 400);
    if (!productData.name) throw new AppError('name is required', 400);
    if (!productData.shortDescription) throw new AppError('shortDescription is required', 400);
    if (!productData.description) throw new AppError('description is required', 400);
    if (productData.isVeg === undefined) throw new AppError('isVeg is required', 400);
    if (!productData.variants || productData.variants.length === 0) throw new AppError('At least one variant is required', 400);

    const category = await Category.findById(categoryId);
    if (!category) throw new AppError('Category not found', 404);

    const slug = productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
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
 * Full product update
 */
router.put('/products/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categoryId, ...updateData } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) throw new AppError('Product not found', 404);

    // If category changed, update categoryName + categorySlug
    if (categoryId && categoryId !== String(product.category)) {
      const category = await Category.findById(categoryId);
      if (!category) throw new AppError('Category not found', 404);
      updateData.category = category._id;
      updateData.categoryName = category.name;
      updateData.categorySlug = category.slug;

      // Update item counts
      await Promise.all([
        Category.findByIdAndUpdate(product.category, { $inc: { itemCount: -1 } }),
        Category.findByIdAndUpdate(category._id, { $inc: { itemCount: 1 } }),
      ]);
    }

    // Regenerate slug if name changed
    if (updateData.name && updateData.name !== product.name) {
      const newSlug = updateData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const conflict = await Product.findOne({ slug: newSlug, _id: { $ne: product._id } });
      if (conflict) throw new AppError('A product with this name already exists', 409);
      updateData.slug = newSlug;
    }

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.json({ success: true, data: updated!.toJSON(), message: 'Product updated' });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/admin/products/:id
 * Soft delete (archive) — sets isActive: false
 */
router.delete('/products/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: false, isAvailable: false } },
      { new: true }
    );
    if (!product) throw new AppError('Product not found', 404);

    // Update category item count
    await Category.findByIdAndUpdate(product.category, { $inc: { itemCount: -1 } });

    res.json({ success: true, message: `"${product.name}" archived` });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/admin/products/:id/restore
 * Restore an archived product
 */
router.patch('/products/:id/restore', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: true } },
      { new: true }
    );
    if (!product) throw new AppError('Product not found', 404);
    await Category.findByIdAndUpdate(product.category, { $inc: { itemCount: 1 } });
    res.json({ success: true, data: product.toJSON(), message: `"${product.name}" restored` });
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
 * PATCH /api/admin/products/:id/toggle-featured
 */
router.patch('/products/:id/toggle-featured', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) throw new AppError('Product not found', 404);
    product.isFeatured = !product.isFeatured;
    await product.save();
    res.json({ success: true, data: product.toJSON(), message: `Featured ${product.isFeatured ? 'on' : 'off'}` });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/admin/products/:id/toggle-bestseller
 */
router.patch('/products/:id/toggle-bestseller', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) throw new AppError('Product not found', 404);
    product.isBestSeller = !product.isBestSeller;
    await product.save();
    res.json({ success: true, data: product.toJSON(), message: `Best Seller ${product.isBestSeller ? 'on' : 'off'}` });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/admin/products/:id/toggle-new
 */
router.patch('/products/:id/toggle-new', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) throw new AppError('Product not found', 404);
    product.isNewItem = !product.isNewItem;
    await product.save();
    res.json({ success: true, data: product.toJSON(), message: `"New" badge ${product.isNewItem ? 'on' : 'off'}` });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/admin/products/:id/update-order
 */
router.patch('/products/:id/update-order', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { displayOrder } = req.body;
    if (typeof displayOrder !== 'number') throw new AppError('displayOrder must be a number', 400);
    const product = await Product.findByIdAndUpdate(req.params.id, { $set: { displayOrder } }, { new: true });
    if (!product) throw new AppError('Product not found', 404);
    res.json({ success: true, data: product.toJSON(), message: 'Display order updated' });
  } catch (error) {
    next(error);
  }
});

// ═══════════════════════════════════════════
// CATEGORY MANAGEMENT
// ═══════════════════════════════════════════

/**
 * GET /api/admin/categories
 */
router.get('/categories', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await Category.find().sort({ displayOrder: 1, name: 1 });
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/categories
 */
router.post('/categories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, image, displayOrder } = req.body;
    if (!name) throw new AppError('name is required', 400);

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const existing = await Category.findOne({ slug });
    if (existing) throw new AppError('Category with this name already exists', 409);

    const category = await Category.create({ name, slug, description, image, displayOrder: displayOrder ?? 0 });
    res.status(201).json({ success: true, data: category.toJSON(), message: 'Category created' });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/categories/:id
 */
router.put('/categories/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, image, displayOrder } = req.body;
    const updateData: Record<string, unknown> = {};
    if (description !== undefined) updateData.description = description;
    if (image !== undefined) updateData.image = image;
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder;

    if (name) {
      const category = await Category.findById(req.params.id);
      if (!category) throw new AppError('Category not found', 404);
      if (name !== category.name) {
        const newSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const conflict = await Category.findOne({ slug: newSlug, _id: { $ne: category._id } });
        if (conflict) throw new AppError('Category with this name already exists', 409);
        updateData.name = name;
        updateData.slug = newSlug;
        // Update all products in this category
        await Product.updateMany({ category: category._id }, { $set: { categoryName: name, categorySlug: newSlug } });
      }
    }

    const updated = await Category.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true });
    if (!updated) throw new AppError('Category not found', 404);
    res.json({ success: true, data: updated.toJSON(), message: 'Category updated' });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/admin/categories/:id/toggle
 */
router.patch('/categories/:id/toggle', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) throw new AppError('Category not found', 404);
    category.isActive = !category.isActive;
    await category.save();
    res.json({ success: true, data: category.toJSON(), message: `Category ${category.isActive ? 'activated' : 'deactivated'}` });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/admin/categories/:id
 * Only allowed if no active products exist in this category
 */
router.delete('/categories/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) throw new AppError('Category not found', 404);

    const productCount = await Product.countDocuments({ category: category._id, isActive: true });
    if (productCount > 0) {
      throw new AppError(`Cannot delete category with ${productCount} active product(s). Archive or move products first.`, 409);
    }

    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: `Category "${category.name}" deleted` });
  } catch (error) {
    next(error);
  }
});

// ═══════════════════════════════════════════
// ORDERS
// ═══════════════════════════════════════════

/**
 * GET /api/admin/orders
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

// ═══════════════════════════════════════════
// COUPON MANAGEMENT
// ═══════════════════════════════════════════

/**
 * GET /api/admin/coupons
 */
router.get('/coupons', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, data: coupons });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/coupons
 */
router.post('/coupons', validateBody(createCouponSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const code = req.body.code.toUpperCase();
    const existing = await Coupon.findOne({ code });
    if (existing) throw new AppError('Coupon code already exists', 409);

    const coupon = await Coupon.create({ ...req.body, code });
    res.status(201).json({ success: true, data: coupon.toJSON(), message: 'Coupon created' });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/admin/coupons/:id/toggle
 */
router.patch('/coupons/:id/toggle', async (req: Request, res: Response, next: NextFunction) => {
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

/**
 * DELETE /api/admin/coupons/:id
 */
router.delete('/coupons/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) throw new AppError('Coupon not found', 404);
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (error) {
    next(error);
  }
});

// ═══════════════════════════════════════════
// CUSTOMERS
// ═══════════════════════════════════════════

/**
 * GET /api/admin/customers
 * H6 fix: Returns only non-sensitive fields. Address detail is omitted.
 */
router.get('/customers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '20' } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit));

    const [customers, total] = await Promise.all([
      User.find()
        .select('name email phone createdAt')  // H6: exclude addresses and other PII bulk export
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
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
