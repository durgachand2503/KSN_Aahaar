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
): Promise<{ success: boolean; data?: T; error?: string; message?: string }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

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
      return { success: false, error: json.error || `Request failed (${res.status})` };
    }

    return json;
  } catch {
    return { success: false, error: 'Network error. Please check your connection.' };
  }
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
