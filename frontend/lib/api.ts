/* ═══════════════════════════════════════════
   KSN AAHAAR — API Client
   Typed helpers for backend communication
   ═══════════════════════════════════════════ */

import { API_BASE_URL } from './constants';

/* ── Generic fetch wrapper ── */
async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<{ success: boolean; data?: T; error?: string; message?: string; priceChanges?: PriceChange[]; unavailableItems?: string[] }> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Don't set Content-Type for FormData (let browser set it with boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    const json = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: json.error || `Request failed (${res.status})`,
        priceChanges: json.priceChanges,
        unavailableItems: json.unavailableItems,
      };
    }

    return json;
  } catch {
    return { success: false, error: 'Network error. Please check your connection.' };
  }
}

/* ── Price Change type (for checkout) ── */
export interface PriceChange {
  productName: string;
  variantName: string;
  oldPrice: number;
  newPrice: number;
}

/* ── Public Menu API ── */
export interface ApiProductVariant {
  _id: string;
  name: string;
  price: number;
  isAvailable: boolean;
}

export interface ApiProduct {
  _id: string;
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  categoryName: string;
  categorySlug: string;
  image: string;
  isVeg: boolean;
  isAvailable: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewItem: boolean;
  isActive: boolean;
  variants: ApiProductVariant[];
  ingredients?: string[];
  servingInfo?: string;
  displayOrder: number;
  popularity: number;
  createdAt: string;
}

export interface ApiCategory {
  _id: string;
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  displayOrder: number;
  itemCount: number;
  isActive: boolean;
}

export async function getPublicProducts(params?: {
  category?: string;
  veg?: boolean;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.category && params.category !== 'all') qs.set('category', params.category);
  if (params?.veg) qs.set('veg', 'true');
  if (params?.search) qs.set('search', params.search);
  if (params?.sort) qs.set('sort', params.sort);
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  return apiFetch<{ products: ApiProduct[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
    `/products${qs.toString() ? `?${qs}` : ''}`
  );
}

export async function getPublicCategories() {
  return apiFetch<ApiCategory[]>('/products/categories');
}

export async function getPublicProduct(slug: string) {
  return apiFetch<ApiProduct>(`/products/${slug}`);
}

/* ── Order API ── */
export interface CreateOrderPayload {
  items: {
    productId: string;
    variantId: string;
    productName: string;
    variantName: string;
    unitPrice: number;
    quantity: number;
    image: string;
    isVeg: boolean;
  }[];
  orderType: 'delivery' | 'pickup';
  deliveryAddress?: {
    houseFlat: string;
    street: string;
    area: string;
    city: string;
    state?: string;
    pincode: string;
    instructions?: string;
  };
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  couponCode?: string;
  notes?: string;
  scheduledTime?: string;
}

export async function createOrder(payload: CreateOrderPayload, token?: string | null) {
  return apiFetch<{ orderId: string; id: string; total: number }>(
    '/orders',
    { method: 'POST', body: JSON.stringify(payload) },
    token
  );
}

/* ── Payment API ── */
export interface PaymentOrderResponse {
  razorpayOrderId: string;
  amount: number;
  currency: string;
  key: string;
}

export async function createPaymentOrder(orderId: string) {
  return apiFetch<PaymentOrderResponse>(
    '/payments/create-order',
    { method: 'POST', body: JSON.stringify({ orderId }) }
  );
}

export async function verifyPayment(data: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) {
  return apiFetch<{ orderId: string }>(
    '/payments/verify',
    { method: 'POST', body: JSON.stringify(data) }
  );
}

/* ── Coupon API ── */
export interface CouponValidationResponse {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discountAmount: number;
  description: string;
}

export async function validateCoupon(code: string, subtotal: number) {
  return apiFetch<CouponValidationResponse>(
    '/coupons/validate',
    { method: 'POST', body: JSON.stringify({ code, subtotal }) }
  );
}

/* ── Order Tracking ── */
export interface OrderData {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  items: {
    productId: string;
    productName: string;
    variantName: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
    image: string;
    isVeg: boolean;
  }[];
  orderType: 'delivery' | 'pickup';
  deliveryAddress?: {
    houseFlat: string;
    street: string;
    area: string;
    city: string;
    state: string;
    pincode: string;
    instructions?: string;
  };
  paymentStatus: string;
  orderStatus: string;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  couponCode?: string;
  notes?: string;
  scheduledTime?: string;
  statusHistory: { status: string; timestamp: string; note?: string }[];
  createdAt: string;
  updatedAt: string;
}

export async function getOrder(orderId: string, token?: string | null) {
  return apiFetch<OrderData>(`/orders/${orderId}`, {}, token);
}

export async function getMyOrders(token: string, page = 1) {
  return apiFetch<{ orders: OrderData[]; pagination: { page: number; total: number; totalPages: number } }>(
    `/orders/my-orders?page=${page}`,
    {},
    token
  );
}

/* ── Admin API ── */
export interface AdminDashboardData {
  stats: {
    totalOrders: number;
    todayOrders: number;
    pendingOrders: number;
    totalRevenue: number;
    todayRevenue: number;
    totalCustomers: number;
    totalProducts: number;
    activeCoupons: number;
  };
  recentOrders: AdminOrderSummary[];
}

export interface AdminOrderSummary {
  _id: string;
  orderId: string;
  customerName: string;
  orderStatus: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  orderType: string;
}

export async function adminLogin(email: string, password: string) {
  return apiFetch<{ admin: { id: string; name: string; email: string; role: string }; token: string }>(
    '/admin/login',
    { method: 'POST', body: JSON.stringify({ email, password }) }
  );
}

export async function getAdminDashboard(token: string) {
  return apiFetch<AdminDashboardData>('/admin/dashboard', {}, token);
}

export async function getAdminOrders(token: string, params?: { status?: string; page?: number; search?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.status && params.status !== 'all') searchParams.set('status', params.status);
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.search) searchParams.set('search', params.search);
  const qs = searchParams.toString();

  return apiFetch<{ orders: OrderData[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
    `/admin/orders${qs ? `?${qs}` : ''}`,
    {},
    token
  );
}

export async function updateOrderStatus(orderId: string, status: string, token: string, note?: string) {
  return apiFetch<OrderData>(
    `/orders/${orderId}/status`,
    { method: 'PATCH', body: JSON.stringify({ status, note }) },
    token
  );
}

/* ── Contact API ── */
export async function sendContactMessage(data: {
  name: string;
  email: string;
  phone?: string;
  message: string;
}) {
  return apiFetch<null>('/contact', { method: 'POST', body: JSON.stringify(data) });
}

/* ── Public Coupons API ── */
export interface PublicCoupon {
  _id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number;
  description: string;
}

export async function getActiveCoupons() {
  return apiFetch<PublicCoupon[]>('/coupons/active');
}

/* ── Admin Product type ── */
export interface AdminProduct {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  category: string;           // ObjectId string
  categoryName: string;
  categorySlug: string;
  image: string;
  isVeg: boolean;
  isAvailable: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewItem: boolean;
  isActive: boolean;
  variants: { _id?: string; name: string; price: number; isAvailable: boolean }[];
  ingredients?: string[];
  servingInfo?: string;
  displayOrder: number;
  popularity: number;
  createdAt: string;
  updatedAt: string;
}

/* ── Admin Category type ── */
export interface AdminCategory {
  _id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  displayOrder: number;
  itemCount: number;
  isActive: boolean;
  createdAt: string;
}

/* ── Admin Products API ── */
export async function getAdminProducts(token: string, params?: {
  search?: string;
  category?: string;
  veg?: string;
  featured?: string;
  bestseller?: string;
  available?: string;
  active?: string;
  sort?: string;
  page?: number;
  limit?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.search) qs.set('search', params.search);
  if (params?.category) qs.set('category', params.category);
  if (params?.veg) qs.set('veg', params.veg);
  if (params?.featured) qs.set('featured', params.featured);
  if (params?.bestseller) qs.set('bestseller', params.bestseller);
  if (params?.available) qs.set('available', params.available);
  if (params?.active) qs.set('active', params.active);
  if (params?.sort) qs.set('sort', params.sort);
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  return apiFetch<{ products: AdminProduct[]; pagination: { total: number; totalPages: number; page: number; limit: number } }>(
    `/admin/products${qs.toString() ? `?${qs}` : ''}`,
    {},
    token
  );
}

export async function createAdminProduct(
  data: Omit<AdminProduct, '_id' | 'slug' | 'createdAt' | 'updatedAt'> & { categoryId: string },
  token: string
) {
  return apiFetch<AdminProduct>('/admin/products', { method: 'POST', body: JSON.stringify(data) }, token);
}

export async function updateAdminProduct(id: string, data: Partial<AdminProduct> & { categoryId?: string }, token: string) {
  return apiFetch<AdminProduct>(`/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token);
}

export async function deleteAdminProduct(id: string, token: string) {
  return apiFetch<null>(`/admin/products/${id}`, { method: 'DELETE' }, token);
}

export async function restoreAdminProduct(id: string, token: string) {
  return apiFetch<AdminProduct>(`/admin/products/${id}/restore`, { method: 'PATCH' }, token);
}

export async function toggleProductAvailability(id: string, token: string) {
  return apiFetch<AdminProduct>(`/admin/products/${id}/toggle-availability`, { method: 'PATCH' }, token);
}

export async function toggleProductFeatured(id: string, token: string) {
  return apiFetch<AdminProduct>(`/admin/products/${id}/toggle-featured`, { method: 'PATCH' }, token);
}

export async function toggleProductBestSeller(id: string, token: string) {
  return apiFetch<AdminProduct>(`/admin/products/${id}/toggle-bestseller`, { method: 'PATCH' }, token);
}

export async function toggleProductNew(id: string, token: string) {
  return apiFetch<AdminProduct>(`/admin/products/${id}/toggle-new`, { method: 'PATCH' }, token);
}

export async function updateProductDisplayOrder(id: string, displayOrder: number, token: string) {
  return apiFetch<AdminProduct>(`/admin/products/${id}/update-order`, { method: 'PATCH', body: JSON.stringify({ displayOrder }) }, token);
}

/** Upload an image file; returns { url, filename } */
export async function uploadProductImage(file: File, token: string) {
  const form = new FormData();
  form.append('image', file);
  return apiFetch<{ url: string; filename: string }>(
    '/admin/upload/image',
    { method: 'POST', body: form },
    token
  );
}

export async function deleteProductImage(filename: string, token: string) {
  return apiFetch<null>(
    '/admin/upload/image',
    { method: 'DELETE', body: JSON.stringify({ filename }) },
    token
  );
}

/* ── Admin Categories API ── */
export async function getAdminCategories(token: string) {
  return apiFetch<AdminCategory[]>('/admin/categories', {}, token);
}

export async function createAdminCategory(
  data: { name: string; description?: string; image?: string; displayOrder?: number },
  token: string
) {
  return apiFetch<AdminCategory>('/admin/categories', { method: 'POST', body: JSON.stringify(data) }, token);
}

export async function updateAdminCategory(id: string, data: Partial<AdminCategory>, token: string) {
  return apiFetch<AdminCategory>(`/admin/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token);
}

export async function toggleAdminCategory(id: string, token: string) {
  return apiFetch<AdminCategory>(`/admin/categories/${id}/toggle`, { method: 'PATCH' }, token);
}

export async function deleteAdminCategory(id: string, token: string) {
  return apiFetch<null>(`/admin/categories/${id}`, { method: 'DELETE' }, token);
}

/* ── Admin Coupon type ── */
export interface AdminCoupon {
  id: string;
  _id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number;
  expiryDate: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  description: string;
  createdAt: string;
}

export interface CreateCouponPayload {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  expiryDate: string;
  usageLimit?: number;
  description?: string;
}

/* ── Admin Coupons API ── */
export async function getAdminCoupons(token: string) {
  return apiFetch<AdminCoupon[]>('/admin/coupons', {}, token);
}

export async function createAdminCoupon(data: CreateCouponPayload, token: string) {
  return apiFetch<AdminCoupon>(
    '/admin/coupons',
    { method: 'POST', body: JSON.stringify(data) },
    token
  );
}

export async function toggleAdminCoupon(id: string, token: string) {
  return apiFetch<AdminCoupon>(`/admin/coupons/${id}/toggle`, { method: 'PATCH' }, token);
}

export async function deleteAdminCoupon(id: string, token: string) {
  return apiFetch<null>(`/admin/coupons/${id}`, { method: 'DELETE' }, token);
}
