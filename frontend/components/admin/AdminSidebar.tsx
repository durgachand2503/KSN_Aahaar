'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { getAdminOrders } from '@/lib/api';

/* ── Icons ── */
const DashboardIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="4" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="11" width="7" height="10" rx="1.5" />
  </svg>
);
const OrdersIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z" /><path d="M15 3v4a2 2 0 0 0 2 2h4" />
    <path d="M10 13H8" /><path d="M16 17H8" /><path d="M16 13h-2" />
  </svg>
);
const ProductsIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);
const CouponsIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 5H3v4a1 1 0 0 0 0 2v4h18v-4a1 1 0 0 0 0-2V5Z" /><path d="M9 5v14" strokeDasharray="2 2" />
  </svg>
);
const LogoutIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
const CloseIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
const CategoriesIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

/* ── Active order count badge ── */
const ACTIVE_ORDER_STATUSES = ['placed', 'payment_confirmed', 'accepted', 'preparing', 'ready'];

function usePendingOrderCount(isAuthenticated: boolean) {
  const [count, setCount] = useState(0);

  const fetchCount = useCallback(async () => {
    if (!isAuthenticated) return;
    const res = await getAdminOrders('', { status: 'all' });
    if (res.success && res.data) {
      const active = res.data.orders.filter(o => ACTIVE_ORDER_STATUSES.includes(o.orderStatus));
      setCount(active.length);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30_000);
    return () => clearInterval(interval);
  }, [fetchCount]);

  return count;
}

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: DashboardIcon, exact: true, badge: false },
  { href: '/admin/orders', label: 'Orders', icon: OrdersIcon, exact: false, badge: true },
  { href: '/admin/products', label: 'Menu Items', icon: ProductsIcon, exact: false, badge: false },
  { href: '/admin/categories', label: 'Categories', icon: CategoriesIcon, exact: false, badge: false },
  { href: '/admin/coupons', label: 'Coupons', icon: CouponsIcon, exact: false, badge: false },
];

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
}

function SidebarContent({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const { admin, logout, isAuthenticated } = useAdminAuth();
  const pendingCount = usePendingOrderCount(isAuthenticated);

  return (
    <div className="flex flex-col h-full">
      {/* Logo + close */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <Link href="/admin" onClick={onClose} className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gold flex items-center justify-center text-forest font-bold text-sm font-heading flex-shrink-0">K</div>
          <div>
            <p className="text-white font-heading font-bold text-sm leading-none">KSN AAHAAR</p>
            <p className="text-white/40 text-[10px] uppercase tracking-widest mt-0.5">Admin Panel</p>
          </div>
        </Link>
        {/* Close btn — only visible on mobile */}
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-white/40 hover:bg-white/10 hover:text-white transition-colors"
          aria-label="Close menu"
        >
          <CloseIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const showBadge = item.badge && pendingCount > 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative',
                isActive
                  ? 'bg-white/12 text-white'
                  : 'text-white/55 hover:bg-white/8 hover:text-white/90'
              )}
            >
              {/* Active left accent */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-gold rounded-full" />
              )}
              <item.icon className={cn('w-[18px] h-[18px] flex-shrink-0', isActive ? 'text-gold' : 'text-white/40 group-hover:text-white/70')} />
              <span className="flex-1">{item.label}</span>
              {/* Live pending badge */}
              {showBadge && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="min-w-[20px] h-5 px-1.5 rounded-full bg-maroon text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 tabular-nums">
                  {pendingCount > 99 ? '99+' : pendingCount}
                </motion.span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* View site link */}
      <div className="px-3 pb-2">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-white/35 hover:bg-white/6 hover:text-white/60 transition-all"
        >
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /><path d="M2 12h20" />
          </svg>
          View Customer Site
        </Link>
      </div>

      {/* Admin info + logout */}
      <div className="p-3 border-t border-white/10">
        {admin && (
          <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center text-gold font-bold text-xs flex-shrink-0">
              {admin.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate">{admin.name}</p>
              <p className="text-white/35 text-[10px] truncate">{admin.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-white/45 hover:bg-red-500/12 hover:text-red-300 transition-all"
        >
          <LogoutIcon className="w-4 h-4 flex-shrink-0" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  return (
    <>
      {/* Desktop sidebar — always visible */}
      <aside className="hidden lg:flex flex-col w-60 bg-forest-dark min-h-screen flex-shrink-0">
        <SidebarContent onClose={onClose} />
      </aside>

      {/* Mobile sidebar — slide-in drawer */}
      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.22, ease: 'easeInOut' }}
            className="lg:hidden fixed inset-y-0 left-0 z-40 w-64 bg-forest-dark flex flex-col shadow-2xl"
          >
            <SidebarContent onClose={onClose} />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
