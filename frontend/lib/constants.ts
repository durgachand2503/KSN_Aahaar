/* ═══════════════════════════════════════════
   KSN AAHAAR — Brand, Config & UI Constants

   This file contains ONLY static brand/config
   constants used across the frontend.

   Menu data (products, categories) lives
   exclusively in the database and is served by
   the backend API — it is NOT hardcoded here.
   ═══════════════════════════════════════════ */

// ── Brand ──
export const BRAND = {
  name: 'KSN AAHAAR',
  tagline: 'Taste the Warmth of Home, Delivered Fresh',
  description: 'Authentic flavours, lovingly prepared and delivered fresh from KSN AAHAAR.',
  location: 'Miyapur, Hyderabad, Telangana, India',
  phone: '+91 79938 77507',
  email: 'order@ksnaahaar.com',
  whatsapp: '+917993877507',
} as const;

// ── API ──
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Build an absolute URL for a media file (image, etc.) returned by the backend.
 * The backend returns paths like `/uploads/image.jpg`. This function prepends
 * the server origin (strips the /api suffix from API_BASE_URL).
 */
export function getMediaUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  // Derive server origin: remove trailing /api (or /api/) segment
  const origin = API_BASE_URL.replace(/\/api\/?$/, '');
  return `${origin}${path.startsWith('/') ? '' : '/'}${path}`;
}

// ── Delivery Defaults ──
export const DELIVERY_DEFAULTS = {
  charge: 30,
  freeThreshold: 500,
  minOrder: 199,
  estimatedTime: '30-45 min',
} as const;

// ── Navigation Links ──
export const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Menu', href: '/menu' },
  { label: 'About', href: '/about' },
  { label: 'Offers', href: '/offers' },
  { label: 'Contact', href: '/contact' },
] as const;

export const FOOTER_LINKS = {
  quickLinks: [
    { label: 'Home', href: '/' },
    { label: 'Menu', href: '/menu' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Offers', href: '/offers' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms & Conditions', href: '/terms' },
    { label: 'Refund Policy', href: '/refund-policy' },
  ],
} as const;

// ── Order Status Labels ──
export const ORDER_STATUS_LABELS: Record<string, string> = {
  placed: 'Order Placed',
  payment_pending: 'Payment Pending',
  payment_confirmed: 'Payment Confirmed',
  payment_failed: 'Payment Failed',
  accepted: 'Order Accepted',
  preparing: 'Preparing',
  ready: 'Ready',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refund_pending: 'Refund Pending',
  refunded: 'Refunded',
};

// ── Business Hours Default ──
export const DEFAULT_BUSINESS_HOURS = [
  { day: 'Monday',    isOpen: true, openTime: '11:00', closeTime: '22:00' },
  { day: 'Tuesday',   isOpen: true, openTime: '11:00', closeTime: '22:00' },
  { day: 'Wednesday', isOpen: true, openTime: '11:00', closeTime: '22:00' },
  { day: 'Thursday',  isOpen: true, openTime: '11:00', closeTime: '22:00' },
  { day: 'Friday',    isOpen: true, openTime: '11:00', closeTime: '22:00' },
  { day: 'Saturday',  isOpen: true, openTime: '11:00', closeTime: '22:00' },
  { day: 'Sunday',    isOpen: true, openTime: '11:00', closeTime: '22:00' },
];
