import { z } from 'zod';

// ── Auth Validators ──
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email format'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const adminLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// ── Order Validators ──
export const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    variantId: z.string(),
    productName: z.string(),
    variantName: z.string(),
    unitPrice: z.number().min(0),
    quantity: z.number().int().min(1),
    image: z.string(),
    isVeg: z.boolean(),
  })).min(1, 'At least one item is required'),
  orderType: z.enum(['delivery', 'pickup']),
  deliveryAddress: z.object({
    houseFlat: z.string().min(1),
    street: z.string().min(1),
    area: z.string().min(1),
    city: z.string().min(1),
    state: z.string().default('Telangana'),
    pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode'),
    instructions: z.string().optional(),
  }).optional(),
  customerName: z.string().min(2),
  customerPhone: z.string().regex(/^[6-9]\d{9}$/),
  customerEmail: z.string().email().optional().or(z.literal('')),
  couponCode: z.string().optional(),
  notes: z.string().max(500).optional(),
  scheduledTime: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'placed', 'payment_pending', 'payment_confirmed', 'payment_failed',
    'accepted', 'preparing', 'ready', 'out_for_delivery',
    'delivered', 'cancelled', 'refund_pending', 'refunded',
  ]),
  note: z.string().max(500).optional(),
});

// ── Coupon Validators ──
export const validateCouponSchema = z.object({
  code: z.string().min(1, 'Coupon code is required'),
  subtotal: z.number().min(0),
});

export const createCouponSchema = z.object({
  code: z.string().min(3).max(20),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().min(0),
  minOrderAmount: z.number().min(0).default(0),
  maxDiscount: z.number().min(0).optional(),
  expiryDate: z.string(),
  usageLimit: z.number().int().min(0).default(100),
  description: z.string().default(''),
});

// ── Product Validators ──
export const createProductSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  shortDescription: z.string().min(10),
  categoryId: z.string(),
  image: z.string(),
  isVeg: z.boolean(),
  isFeatured: z.boolean().default(false),
  variants: z.array(z.object({
    name: z.string(),
    price: z.number().min(0),
    isAvailable: z.boolean().default(true),
  })).min(1),
  ingredients: z.array(z.string()).default([]),
  servingInfo: z.string().default(''),
  displayOrder: z.number().int().default(0),
});

// ── Address Validator ──
export const addressSchema = z.object({
  label: z.string().optional(),
  houseFlat: z.string().min(1),
  street: z.string().min(1),
  area: z.string().min(1),
  city: z.string().min(1),
  state: z.string().default('Telangana'),
  pincode: z.string().regex(/^\d{6}$/),
  instructions: z.string().optional(),
  isDefault: z.boolean().default(false),
});
