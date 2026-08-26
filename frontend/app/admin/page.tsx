'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { getAdminDashboard, type AdminDashboardData, type AdminOrderSummary } from '@/lib/api';
import { formatPrice, formatDateTime, getGreeting } from '@/lib/utils';
import StatsCard from '@/components/admin/StatsCard';
import OrderStatusBadge, { PaymentStatusBadge } from '@/components/admin/OrderStatusBadge';

/* ── Icons ── */
function ShoppingBagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function DollarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4 },
  }),
};

export default function AdminDashboardPage() {
  const { admin, token } = useAdminAuth();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    if (!token) return;
    const result = await getAdminDashboard(token);
    if (result.success && result.data) {
      setData(result.data);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-forest/20 border-t-forest rounded-full animate-spin" />
      </div>
    );
  }

  const stats = data?.stats;
  const recentOrders = data?.recentOrders || [];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading font-bold text-2xl text-forest">
          {getGreeting()}, {admin?.name?.split(' ')[0] || 'Admin'} 👋
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Here&apos;s how your kitchen is doing today.
        </p>
      </div>

      {/* Stats Grid */}
      {stats && (
        <motion.div
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <motion.div variants={fadeUp} custom={0}>
            <StatsCard
              title="Today's Orders"
              value={stats.todayOrders}
              subtitle={`${stats.totalOrders} total`}
              icon={<ShoppingBagIcon className="w-5 h-5" />}
              color="forest"
            />
          </motion.div>
          <motion.div variants={fadeUp} custom={1}>
            <StatsCard
              title="Today's Revenue"
              value={formatPrice(stats.todayRevenue)}
              subtitle={`${formatPrice(stats.totalRevenue)} total`}
              icon={<DollarIcon className="w-5 h-5" />}
              color="gold"
            />
          </motion.div>
          <motion.div variants={fadeUp} custom={2}>
            <StatsCard
              title="Pending Orders"
              value={stats.pendingOrders}
              subtitle="Needs attention"
              icon={<ClockIcon className="w-5 h-5" />}
              color="maroon"
            />
          </motion.div>
          <motion.div variants={fadeUp} custom={3}>
            <StatsCard
              title="Customers"
              value={stats.totalCustomers}
              subtitle={`${stats.totalProducts} products`}
              icon={<UsersIcon className="w-5 h-5" />}
              color="blue"
            />
          </motion.div>
        </motion.div>
      )}

      {/* Recent Orders */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-white rounded-xl shadow-soft"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <h2 className="font-heading font-semibold text-base text-forest">Recent Orders</h2>
          <Link
            href="/admin/orders"
            className="text-xs font-medium text-gold-dark hover:text-gold transition-colors"
          >
            View All →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-neutral-400 text-sm">No orders yet. They&apos;ll appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[11px] text-neutral-500 uppercase tracking-wider border-b border-neutral-100">
                  <th className="px-6 py-3 font-medium">Order ID</th>
                  <th className="px-6 py-3 font-medium">Customer</th>
                  <th className="px-6 py-3 font-medium">Type</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Payment</th>
                  <th className="px-6 py-3 font-medium text-right">Total</th>
                  <th className="px-6 py-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order: AdminOrderSummary) => (
                  <tr key={order._id} className="border-b border-neutral-50 hover:bg-cream/50 transition-colors">
                    <td className="px-6 py-3">
                      <Link href={`/admin/orders?highlight=${order.orderId}`} className="font-mono text-sm font-medium text-forest hover:text-gold-dark">
                        {order.orderId}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-sm text-neutral-700">{order.customerName}</td>
                    <td className="px-6 py-3">
                      <span className="text-[11px] uppercase tracking-wide text-neutral-500 font-medium">
                        {order.orderType === 'delivery' ? '🛵 Delivery' : '🏪 Pickup'}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <OrderStatusBadge status={order.orderStatus} />
                    </td>
                    <td className="px-6 py-3">
                      <PaymentStatusBadge status={order.paymentStatus} />
                    </td>
                    <td className="px-6 py-3 text-sm font-semibold text-forest text-right">
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-6 py-3 text-xs text-neutral-500 whitespace-nowrap">
                      {formatDateTime(order.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
