'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { getAdminDashboard, getAdminOrders, type AdminDashboardData, type AdminOrderSummary, type OrderData } from '@/lib/api';
import { formatPrice, formatDateTime, formatTime, getGreeting } from '@/lib/utils';
import StatsCard from '@/components/admin/StatsCard';
import OrderStatusBadge, { PaymentStatusBadge } from '@/components/admin/OrderStatusBadge';

/* ── Icons ── */
const ShoppingBagIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);
const DollarIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);
const UsersIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);
const RefreshIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" />
  </svg>
);

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.35 } }),
};

/* ── Pipeline stage config ── */
const PIPELINE_STAGES: { status: string; label: string; emoji: string; color: string; bg: string; border: string }[] = [
  { status: 'placed',           label: 'Placed',      emoji: '🆕', color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-100'   },
  { status: 'payment_confirmed', label: 'Paid',        emoji: '✅', color: 'text-forest',     bg: 'bg-forest/8',  border: 'border-forest/15'  },
  { status: 'accepted',         label: 'Accepted',    emoji: '👍', color: 'text-teal-700',   bg: 'bg-teal-50',   border: 'border-teal-100'   },
  { status: 'preparing',        label: 'Preparing',   emoji: '👨‍🍳', color: 'text-gold-dark',  bg: 'bg-gold/10',   border: 'border-gold/20'    },
  { status: 'ready',            label: 'Ready',       emoji: '🍱', color: 'text-forest',     bg: 'bg-forest/10', border: 'border-forest/20'  },
  { status: 'out_for_delivery', label: 'On the Way',  emoji: '🛵', color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-100' },
];

function OrderPipeline({ orders }: { orders: OrderData[] }) {
  const counts = PIPELINE_STAGES.map(s => ({
    ...s,
    count: orders.filter(o => o.orderStatus === s.status).length,
  }));
  const total = counts.reduce((acc, s) => acc + s.count, 0);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
      className="bg-white rounded-xl border border-neutral-100 shadow-soft p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-heading font-semibold text-neutral-800 text-sm">Order Pipeline</h2>
          <p className="text-[11px] text-neutral-400">{total} active order{total !== 1 ? 's' : ''} right now</p>
        </div>
        <Link href="/admin/orders" className="text-xs font-semibold text-forest hover:text-gold-dark transition-colors">
          Manage →
        </Link>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {counts.map(stage => (
          <Link key={stage.status} href={`/admin/orders?status=${stage.status}`}
            className={`flex flex-col items-center p-2.5 rounded-xl border transition-all hover:scale-105 ${stage.bg} ${stage.border}`}>
            <span className="text-xl mb-1">{stage.emoji}</span>
            <span className={`text-xl font-bold font-heading leading-none ${stage.count > 0 ? stage.color : 'text-neutral-300'}`}>
              {stage.count}
            </span>
            <span className={`text-[9px] font-semibold mt-0.5 text-center leading-tight ${stage.count > 0 ? stage.color : 'text-neutral-300'}`}>
              {stage.label}
            </span>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}

export default function AdminDashboardPage() {
  const { admin, isAuthenticated } = useAdminAuth();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [activeOrders, setActiveOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const isFirstLoad = useRef(true);

  const fetchDashboard = useCallback(async (isManual = false) => {
    if (!isAuthenticated) return;
    if (isManual) setRefreshing(true);

    const [dashResult, ordersResult] = await Promise.all([
      getAdminDashboard(''),
      getAdminOrders('', { status: 'all' }),
    ]);

    if (dashResult.success && dashResult.data) setData(dashResult.data);
    if (ordersResult.success && ordersResult.data) {
      const active = ordersResult.data.orders.filter(o =>
        ['placed', 'payment_confirmed', 'accepted', 'preparing', 'ready', 'out_for_delivery'].includes(o.orderStatus)
      );
      setActiveOrders(active);
    }

    setLastUpdated(new Date());
    if (isFirstLoad.current) { setLoading(false); isFirstLoad.current = false; }
    if (isManual) setRefreshing(false);
  }, [isAuthenticated]);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(() => fetchDashboard(), 30_000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-forest/20 border-t-forest rounded-full animate-spin" />
          <p className="text-sm text-neutral-400">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  const stats = data?.stats;
  const recentOrders = data?.recentOrders || [];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-7">
        <div>
          <h1 className="font-heading font-bold text-2xl text-forest">
            {getGreeting()}, {admin?.name?.split(' ')[0] || 'Admin'} 👋
          </h1>
          <p className="text-sm text-neutral-400 mt-1">Here&apos;s an overview of your kitchen today.</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <button
            onClick={() => fetchDashboard(true)}
            disabled={refreshing}
            title="Refresh data"
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-neutral-200 text-sm font-medium text-neutral-500 hover:bg-cream hover:text-forest transition-all shadow-soft disabled:opacity-50">
            <RefreshIcon className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {lastUpdated && (
            <p className="text-[10px] text-neutral-400">
              Updated {formatTime(lastUpdated)}
            </p>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <motion.div initial="hidden" animate="visible"
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <motion.div variants={fadeUp} custom={0}>
            <StatsCard title="Today's Orders" value={stats.todayOrders}
              subtitle={`${stats.totalOrders} total`} icon={<ShoppingBagIcon className="w-5 h-5" />} color="forest" />
          </motion.div>
          <motion.div variants={fadeUp} custom={1}>
            <StatsCard title="Today's Revenue" value={formatPrice(stats.todayRevenue)}
              subtitle={`${formatPrice(stats.totalRevenue)} total`} icon={<DollarIcon className="w-5 h-5" />} color="gold" />
          </motion.div>
          <motion.div variants={fadeUp} custom={2}>
            <StatsCard title="Active Orders" value={stats.pendingOrders}
              subtitle="Needs attention" icon={<ClockIcon className="w-5 h-5" />} color="maroon" />
          </motion.div>
          <motion.div variants={fadeUp} custom={3}>
            <StatsCard title="Customers" value={stats.totalCustomers}
              subtitle={`${stats.totalProducts} products`} icon={<UsersIcon className="w-5 h-5" />} color="blue" />
          </motion.div>
        </motion.div>
      )}

      {/* Order Pipeline */}
      <OrderPipeline orders={activeOrders} />

      {/* Recent Orders */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }}
        className="bg-white rounded-xl border border-neutral-100 shadow-soft overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <div>
            <h2 className="font-heading font-semibold text-neutral-800">Recent Orders</h2>
            <p className="text-xs text-neutral-400 mt-0.5">Latest {recentOrders.length} orders</p>
          </div>
          <Link href="/admin/orders"
            className="text-xs font-semibold text-forest hover:text-gold-dark transition-colors">
            View All →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-neutral-400 text-sm">No orders yet. They&apos;ll appear here.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-[11px] text-neutral-400 uppercase tracking-wider bg-cream/50 border-b border-neutral-100">
                    <th className="px-5 py-3 font-semibold">Order</th>
                    <th className="px-5 py-3 font-semibold">Customer</th>
                    <th className="px-5 py-3 font-semibold">Type</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Payment</th>
                    <th className="px-5 py-3 font-semibold text-right">Total</th>
                    <th className="px-5 py-3 font-semibold">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {recentOrders.map((order: AdminOrderSummary) => (
                    <tr key={order.orderId} className="hover:bg-cream/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <Link href={`/admin/orders`}
                          className="font-mono text-sm font-semibold text-forest hover:text-gold-dark transition-colors">
                          {order.orderId}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-neutral-700 max-w-[140px] truncate">{order.customerName}</td>
                      <td className="px-5 py-3.5">
                        <span className="text-[11px] font-medium text-neutral-500">
                          {order.orderType === 'delivery' ? '🛵 Delivery' : '🏪 Pickup'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5"><OrderStatusBadge status={order.orderStatus} /></td>
                      <td className="px-5 py-3.5"><PaymentStatusBadge status={order.paymentStatus} /></td>
                      <td className="px-5 py-3.5 text-sm font-bold text-forest text-right">{formatPrice(order.total)}</td>
                      <td className="px-5 py-3.5 text-xs text-neutral-400 whitespace-nowrap">{formatDateTime(order.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-neutral-50">
              {recentOrders.map((order: AdminOrderSummary) => (
                <Link key={order.orderId} href="/admin/orders"
                  className="flex items-start justify-between gap-3 px-4 py-3.5 hover:bg-cream/40 transition-colors block">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-bold text-forest">{order.orderId}</span>
                      <span className="text-xs text-neutral-400">{order.orderType === 'delivery' ? '🛵' : '🏪'}</span>
                    </div>
                    <p className="text-xs text-neutral-600 truncate">{order.customerName}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <OrderStatusBadge status={order.orderStatus} />
                      <PaymentStatusBadge status={order.paymentStatus} />
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-forest">{formatPrice(order.total)}</p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">{formatDateTime(order.createdAt)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
