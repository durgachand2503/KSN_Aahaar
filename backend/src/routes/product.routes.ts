import { Router, Request, Response, NextFunction } from 'express';
import Product from '../models/Product';
import Category from '../models/Category';

const router = Router();

/**
 * GET /api/products
 * Query params: category, veg, search, sort, page, limit
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      category,
      veg,
      search,
      sort = 'popular',
      page = '1',
      limit = '50',
    } = req.query as Record<string, string>;

    const filter: Record<string, unknown> = { isAvailable: true };

    if (category && category !== 'all') {
      filter.categorySlug = category;
    }
    if (veg === 'true') {
      filter.isVeg = true;
    }
    if (search) {
      filter.$text = { $search: search };
    }

    // Sort
    let sortOption: Record<string, 1 | -1> = {};
    switch (sort) {
      case 'price-low': sortOption = { 'variants.0.price': 1 }; break;
      case 'price-high': sortOption = { 'variants.0.price': -1 }; break;
      case 'name-az': sortOption = { name: 1 }; break;
      case 'newest': sortOption = { createdAt: -1 }; break;
      default: sortOption = { popularity: -1, displayOrder: 1 }; break;
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sortOption).skip(skip).limit(limitNum),
      Product.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/products/featured
 */
router.get('/featured', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await Product.find({ isFeatured: true, isAvailable: true })
      .sort({ popularity: -1 })
      .limit(8);

    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/products/categories
 */
router.get('/categories', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ displayOrder: 1 });
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/products/:slug
 */
router.get('/:slug', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await Product.findOne({ slug: req.params.slug });
    if (!product) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
});

export default router;
