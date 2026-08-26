/* ═══════════════════════════════════════════
   KSN AAHAAR — Database Seed Script
   Seeds categories, products, and a default admin
   Run: npx ts-node src/scripts/seed.ts
   ═══════════════════════════════════════════ */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from '../models/Admin';
import Category from '../models/Category';
import Product from '../models/Product';
import Coupon from '../models/Coupon';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ksn-aahaar';

/* ── Categories ── */
const CATEGORIES_DATA = [
  { name: 'Biriyanis', slug: 'biriyanis', description: 'Aromatic rice dishes slow-cooked with traditional spices', displayOrder: 1 },
  { name: 'Rice Items', slug: 'rice-items', description: 'Traditional rice preparations made with authentic flavours', displayOrder: 2 },
  { name: 'Non-Veg Curries', slug: 'non-veg-curries', description: 'Rich curries and fries prepared with fresh meat and spices', displayOrder: 3 },
  { name: 'Veg Curries', slug: 'veg-curries', description: 'Comforting vegetarian curries from traditional recipes', displayOrder: 4 },
  { name: 'Sweets', slug: 'sweets', description: 'Traditional Indian sweets made with love and premium ingredients', displayOrder: 5 },
  { name: 'Snacks — Sweet', slug: 'snacks-sweet', description: 'Handmade sweet snacks and laddus for celebrations', displayOrder: 6 },
  { name: 'Snacks — Savoury', slug: 'snacks-savoury', description: 'Crispy savoury snacks for tea-time and gatherings', displayOrder: 7 },
  { name: 'Special Combos', slug: 'special-combos', description: 'Curated meal combos at special prices', displayOrder: 8 },
];

/* ── Products (samples for each category) ── */
const PRODUCTS_DATA = [
  // Biriyanis
  {
    name: 'Chicken Dum Biriyani',
    slug: 'chicken-dum-biriyani',
    description: 'Classic Hyderabadi dum biryani with tender chicken pieces, fragrant basmati rice, and a blend of aromatic spices. Slow-cooked in a sealed pot for authentic taste.',
    shortDescription: 'Hyderabadi style dum biriyani with tender chicken',
    categorySlug: 'biriyanis',
    image: '/images/food/chicken-biriyani.jpg',
    isVeg: false,
    isFeatured: true,
    variants: [
      { name: 'Regular (serves 1)', price: 199, isAvailable: true },
      { name: 'Family Pack (serves 3-4)', price: 549, isAvailable: true },
    ],
    ingredients: ['Basmati Rice', 'Chicken', 'Onions', 'Yogurt', 'Biryani Masala', 'Saffron', 'Ghee', 'Mint', 'Coriander'],
    servingInfo: 'Served with raita and salan',
    popularity: 95,
  },
  {
    name: 'Mutton Dum Biriyani',
    slug: 'mutton-dum-biriyani',
    description: 'Rich and flavourful mutton biryani made with succulent goat meat and long-grain basmati rice, layered and slow-cooked to perfection.',
    shortDescription: 'Succulent mutton pieces with fragrant rice',
    categorySlug: 'biriyanis',
    image: '/images/food/mutton-biriyani.jpg',
    isVeg: false,
    isFeatured: true,
    variants: [
      { name: 'Regular (serves 1)', price: 249, isAvailable: true },
      { name: 'Family Pack (serves 3-4)', price: 699, isAvailable: true },
    ],
    ingredients: ['Basmati Rice', 'Mutton', 'Onions', 'Yogurt', 'Biryani Masala', 'Saffron', 'Ghee'],
    servingInfo: 'Served with raita and salan',
    popularity: 90,
  },
  {
    name: 'Egg Biriyani',
    slug: 'egg-biriyani',
    description: 'Flavourful egg biryani with boiled eggs cooked in a spiced gravy, layered with aromatic basmati rice.',
    shortDescription: 'Spiced egg biriyani with aromatic rice',
    categorySlug: 'biriyanis',
    image: '/images/food/egg-biriyani.jpg',
    isVeg: false,
    variants: [
      { name: 'Regular (serves 1)', price: 149, isAvailable: true },
      { name: 'Family Pack (serves 3-4)', price: 399, isAvailable: true },
    ],
    ingredients: ['Basmati Rice', 'Eggs', 'Onions', 'Biryani Masala', 'Ghee'],
    servingInfo: 'Served with raita',
    popularity: 75,
  },
  {
    name: 'Veg Dum Biriyani',
    slug: 'veg-dum-biriyani',
    description: 'Aromatic vegetable biryani with seasonal vegetables, paneer, and fragrant basmati rice cooked dum style.',
    shortDescription: 'Seasonal vegetables with fragrant rice',
    categorySlug: 'biriyanis',
    image: '/images/food/veg-biriyani.jpg',
    isVeg: true,
    variants: [
      { name: 'Regular (serves 1)', price: 149, isAvailable: true },
      { name: 'Family Pack (serves 3-4)', price: 399, isAvailable: true },
    ],
    ingredients: ['Basmati Rice', 'Mixed Vegetables', 'Paneer', 'Biryani Masala', 'Ghee', 'Saffron'],
    servingInfo: 'Served with raita',
    popularity: 70,
  },

  // Non-Veg Curries
  {
    name: 'Chicken Curry',
    slug: 'chicken-curry',
    description: 'Traditional home-style chicken curry with a rich, spicy gravy made from fresh tomatoes, onions, and a blend of aromatic spices.',
    shortDescription: 'Home-style spicy chicken curry',
    categorySlug: 'non-veg-curries',
    image: '/images/food/chicken-curry.jpg',
    isVeg: false,
    isFeatured: true,
    variants: [
      { name: 'Half (250ml)', price: 149, isAvailable: true },
      { name: 'Full (500ml)', price: 269, isAvailable: true },
    ],
    ingredients: ['Chicken', 'Onions', 'Tomatoes', 'Ginger-Garlic', 'Red Chilli', 'Turmeric', 'Garam Masala'],
    servingInfo: 'Best paired with rice or roti',
    popularity: 85,
  },
  {
    name: 'Mutton Curry',
    slug: 'mutton-curry',
    description: 'Slow-cooked mutton curry with tender meat in a thick, spiced gravy. A true comfort food classic.',
    shortDescription: 'Slow-cooked tender mutton in spiced gravy',
    categorySlug: 'non-veg-curries',
    image: '/images/food/mutton-curry.jpg',
    isVeg: false,
    variants: [
      { name: 'Half (250ml)', price: 199, isAvailable: true },
      { name: 'Full (500ml)', price: 349, isAvailable: true },
    ],
    ingredients: ['Mutton', 'Onions', 'Tomatoes', 'Ginger-Garlic', 'Red Chilli', 'Garam Masala'],
    servingInfo: 'Best paired with rice or roti',
    popularity: 80,
  },

  // Veg Curries
  {
    name: 'Paneer Butter Masala',
    slug: 'paneer-butter-masala',
    description: 'Creamy, rich paneer curry made with fresh tomato base, butter, cream, and aromatic spices.',
    shortDescription: 'Creamy paneer in rich tomato gravy',
    categorySlug: 'veg-curries',
    image: '/images/food/paneer-butter-masala.jpg',
    isVeg: true,
    isFeatured: true,
    variants: [
      { name: 'Half (250ml)', price: 149, isAvailable: true },
      { name: 'Full (500ml)', price: 259, isAvailable: true },
    ],
    ingredients: ['Paneer', 'Tomatoes', 'Butter', 'Cream', 'Cashew Paste', 'Fenugreek Leaves'],
    servingInfo: 'Best paired with naan or jeera rice',
    popularity: 88,
  },
  {
    name: 'Dal Tadka',
    slug: 'dal-tadka',
    description: 'Comforting yellow dal tempered with cumin, garlic, and ghee. A staple that never disappoints.',
    shortDescription: 'Yellow dal tempered with ghee and cumin',
    categorySlug: 'veg-curries',
    image: '/images/food/dal-tadka.jpg',
    isVeg: true,
    variants: [
      { name: 'Half (250ml)', price: 99, isAvailable: true },
      { name: 'Full (500ml)', price: 179, isAvailable: true },
    ],
    ingredients: ['Toor Dal', 'Ghee', 'Cumin', 'Garlic', 'Red Chilli', 'Turmeric', 'Coriander'],
    servingInfo: 'Best paired with steamed rice',
    popularity: 72,
  },

  // Sweets
  {
    name: 'Gulab Jamun',
    slug: 'gulab-jamun',
    description: 'Soft, melt-in-your-mouth milk dumplings soaked in rose-flavoured sugar syrup. A classic Indian sweet.',
    shortDescription: 'Soft milk dumplings in rose sugar syrup',
    categorySlug: 'sweets',
    image: '/images/food/gulab-jamun.jpg',
    isVeg: true,
    isFeatured: true,
    variants: [
      { name: '4 pieces', price: 89, isAvailable: true },
      { name: '8 pieces', price: 159, isAvailable: true },
    ],
    ingredients: ['Khoya', 'Maida', 'Sugar', 'Rose Water', 'Cardamom', 'Saffron'],
    servingInfo: 'Best served warm',
    popularity: 82,
  },
  {
    name: 'Double Ka Meetha',
    slug: 'double-ka-meetha',
    description: 'A beloved Hyderabadi dessert made with bread slices deep-fried and soaked in sweetened, saffron-infused milk.',
    shortDescription: 'Hyderabadi bread pudding with saffron milk',
    categorySlug: 'sweets',
    image: '/images/food/double-ka-meetha.jpg',
    isVeg: true,
    variants: [
      { name: 'Regular', price: 79, isAvailable: true },
      { name: 'Large', price: 139, isAvailable: true },
    ],
    ingredients: ['Bread', 'Milk', 'Sugar', 'Saffron', 'Cardamom', 'Ghee', 'Almonds'],
    servingInfo: 'Served warm with garnished almonds',
    popularity: 78,
  },
];

/* ── Default Admin ── */
const DEFAULT_ADMIN = {
  name: 'KSN Admin',
  email: 'admin@ksnaahaar.com',
  password: 'admin123456',
  role: 'super_admin' as const,
};

/* ── Default Coupons ── */
const DEFAULT_COUPONS = [
  {
    code: 'WELCOME10',
    discountType: 'percentage' as const,
    discountValue: 10,
    minOrderAmount: 299,
    maxDiscount: 100,
    expiryDate: new Date('2027-12-31'),
    usageLimit: 1000,
    description: '10% off on your first order (max ₹100)',
    isActive: true,
  },
  {
    code: 'KSN50',
    discountType: 'fixed' as const,
    discountValue: 50,
    minOrderAmount: 499,
    expiryDate: new Date('2027-12-31'),
    usageLimit: 500,
    description: 'Flat ₹50 off on orders above ₹499',
    isActive: true,
  },
];

/* ── Main Seed Function ── */
async function seed() {
  console.log('🌱 Starting seed...\n');

  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // --- Categories ---
    console.log('📂 Seeding categories...');
    const categoryMap = new Map<string, mongoose.Types.ObjectId>();

    for (const cat of CATEGORIES_DATA) {
      const existing = await Category.findOne({ slug: cat.slug });
      if (existing) {
        categoryMap.set(cat.slug, existing._id as mongoose.Types.ObjectId);
        console.log(`   ⏩ Category "${cat.name}" already exists`);
      } else {
        const created = await Category.create(cat);
        categoryMap.set(cat.slug, created._id as mongoose.Types.ObjectId);
        console.log(`   ✅ Created category "${cat.name}"`);
      }
    }

    // --- Products ---
    console.log('\n🍽️  Seeding products...');
    for (const prod of PRODUCTS_DATA) {
      const existing = await Product.findOne({ slug: prod.slug });
      if (existing) {
        console.log(`   ⏩ Product "${prod.name}" already exists`);
        continue;
      }

      const categoryId = categoryMap.get(prod.categorySlug);
      if (!categoryId) {
        console.log(`   ⚠️  Category "${prod.categorySlug}" not found for "${prod.name}", skipping`);
        continue;
      }

      const category = CATEGORIES_DATA.find((c) => c.slug === prod.categorySlug)!;
      await Product.create({
        ...prod,
        category: categoryId,
        categoryName: category.name,
      });
      console.log(`   ✅ Created product "${prod.name}"`);
    }

    // Update category item counts
    console.log('\n📊 Updating category item counts...');
    for (const [slug, catId] of categoryMap.entries()) {
      const count = await Product.countDocuments({ category: catId, isAvailable: true });
      await Category.findByIdAndUpdate(catId, { itemCount: count });
      console.log(`   ✅ ${slug}: ${count} items`);
    }

    // --- Admin ---
    console.log('\n👤 Seeding admin user...');
    const existingAdmin = await Admin.findOne({ email: DEFAULT_ADMIN.email });
    if (existingAdmin) {
      console.log(`   ⏩ Admin "${DEFAULT_ADMIN.email}" already exists`);
    } else {
      await Admin.create(DEFAULT_ADMIN);
      console.log(`   ✅ Created admin: ${DEFAULT_ADMIN.email} / ${DEFAULT_ADMIN.password}`);
    }

    // --- Coupons ---
    console.log('\n🎫 Seeding coupons...');
    for (const coupon of DEFAULT_COUPONS) {
      const existing = await Coupon.findOne({ code: coupon.code });
      if (existing) {
        console.log(`   ⏩ Coupon "${coupon.code}" already exists`);
      } else {
        await Coupon.create(coupon);
        console.log(`   ✅ Created coupon "${coupon.code}": ${coupon.description}`);
      }
    }

    console.log('\n═══════════════════════════════════════════');
    console.log('🎉 Seed completed successfully!');
    console.log('');
    console.log('Admin Login:');
    console.log(`   Email:    ${DEFAULT_ADMIN.email}`);
    console.log(`   Password: ${DEFAULT_ADMIN.password}`);
    console.log('═══════════════════════════════════════════\n');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

seed();
