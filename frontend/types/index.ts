/* ═══════════════════════════════════════════
   KSN AAHAAR — Type Definitions
   ═══════════════════════════════════════════ */

// ── Product Types ──
export interface ProductVariant {
  id: string;
  name: string; // e.g., "Single", "Family Pack", "1 KG"
  price: number;
  isAvailable: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  category: string;
  categorySlug: string;
  image: string;
  isVeg: boolean;
  isAvailable: boolean;
  isFeatured: boolean;
  variants: ProductVariant[];
  ingredients?: string[];
  servingInfo?: string;
  displayOrder: number;
  popularity: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  displayOrder: number;
  itemCount: number;
}

// ── Cart Types ──
export interface CartItem {
  productId: string;
  variantId: string;
  productName: string;
  variantName: string;
  price: number;
  quantity: number;
  image: string;
  isVeg: boolean;
}

export interface CartState {
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  couponCode: string | null;
  itemCount: number;
}

// ── Order Types ──
export type OrderType = 'delivery' | 'pickup';

export type OrderStatus =
  | 'placed'
  | 'payment_pending'
  | 'payment_confirmed'
  | 'payment_failed'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refund_pending'
  | 'refunded';

export type PaymentStatus =
  | 'pending'
  | 'captured'
  | 'failed'
  | 'refund_pending'
  | 'refunded';

export interface OrderItemSnapshot {
  productId: string;
  productName: string;
  variantName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  image: string;
  isVeg: boolean;
}

export interface Order {
  id: string;
  orderId: string; // Human-readable: KSN1048
  customerId: string;
  items: OrderItemSnapshot[];
  orderType: OrderType;
  deliveryAddress?: Address;
  scheduledTime?: string;
  paymentId?: string;
  razorpayOrderId?: string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  couponCode?: string;
  notes?: string;
  statusHistory: StatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface StatusHistoryEntry {
  status: OrderStatus;
  timestamp: string;
  note?: string;
}

// ── User Types ──
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  addresses: Address[];
  createdAt: string;
}

export interface Address {
  id: string;
  label?: string;
  houseFlat: string;
  street: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  instructions?: string;
  isDefault: boolean;
}

// ── Auth Types ──
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
}

// ── Coupon Types ──
export type DiscountType = 'percentage' | 'fixed';

export interface Coupon {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number;
  expiryDate: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  description: string;
}

// ── Business Settings ──
export interface BusinessHours {
  day: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export interface DeliveryZone {
  id: string;
  name: string;
  radius: number;
  deliveryCharge: number;
  minOrderAmount: number;
  freeDeliveryThreshold: number;
  estimatedTime: string;
}

export interface BusinessSettings {
  businessHours: BusinessHours[];
  deliveryZones: DeliveryZone[];
  pickupAvailable: boolean;
  scheduledOrdersAvailable: boolean;
  deliveryTimeSlots: string[];
  kitchenLocation: {
    address: string;
    coordinates?: { lat: number; lng: number };
  };
}

// ── Notification Types ──
export type NotificationType =
  | 'order_placed'
  | 'payment_success'
  | 'payment_failed'
  | 'order_accepted'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refund_processed';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  orderId?: string;
  isRead: boolean;
  createdAt: string;
}

// ── API Response Types ──
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
