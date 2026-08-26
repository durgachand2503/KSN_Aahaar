'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { getAdminOrders, updateOrderStatus, type OrderData } from '@/lib/api';
import { formatPrice, formatDateTime, cn } from '@/lib/utils';
import OrderStatusBadge, { PaymentStatusBadge } from '@/components/admin/OrderStatusBadge';
import Button from '@/components/ui/Button';

/* ── Valid status transitions (matches backend) ── */
const VALID_TRANSITIONS: Record<string, string[]> = {
  placed: ['payment_pending', 'cancelled'],
  payment_pending: ['payment_confirmed', 'payment_failed', 'cancelled'],
  payment_confirmed: ['accepted', 'cancelled'],
  payment_failed: ['payment_pending', 'cancelled'],
  accepted: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['out_for_delivery', 'delivered', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: ['refund_pending'],
  refund_pending: ['refunded'],
  refunded: [],
};

const STATUS_LABELS: Record<string, string> = {
  placed: 'Placed',
  payment_pending: 'Pay Pending',
  payment_confirmed: 'Paid',
  payment_failed: 'Pay Failed',
  accepted: 'Accepted',
  preparing: 'Preparing',
  ready: 'Ready',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refund_pending: 'Refund Pending',
  refunded: 'Refunded',
};

const STATUS_FILTERS = ['all', 'placed', 'payment_confirmed', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];

/* ── Icons ── */
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export default function AdminOrdersPage() {
  const { token } = useAdminAuth();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const result = await getAdminOrders(token, { status: statusFilter, page, search: search || undefined });
    if (result.success && result.data) {
      setOrders(result.data.orders);
      setTotalPages(result.data.pagination.totalPages);
    }
    setLoading(false);
  }, [token, statusFilter, page, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [statusFilter, search]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    if (!token) return;
    setUpdatingOrder(orderId);

    const result = await updateOrderStatus(orderId, newStatus, token);
    if (result.success) {
      // Update local state
      setOrders((prev) =>
        prev.map((o) =>
          o.orderId === orderId ? { ...o, orderStatus: newStatus } : o
        )
      );
    }
    setUpdatingOrder(null);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl text-forest">Orders</h1>
        <p className="text-sm text-neutral-500 mt-1">Manage and track all customer orders.</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-soft p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Order ID, name, or phone..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-cream border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {STATUS_FILTERS.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  'px-3 py-2 text-[11px] font-semibold uppercase tracking-wide rounded-lg whitespace-nowrap transition-colors',
                  statusFilter === status
                    ? 'bg-forest text-white'
                    : 'bg-cream text-neutral-500 hover:bg-cream-dark'
                )}
              >
                {status === 'all' ? 'All' : STATUS_LABELS[status] || status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-soft overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-forest/20 border-t-forest rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-neutral-500">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-neutral-400 text-sm">No orders found.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-[11px] text-neutral-500 uppercase tracking-wider border-b border-neutral-100">
                    <th className="px-5 py-3 font-medium">Order</th>
                    <th className="px-5 py-3 font-medium">Customer</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Payment</th>
                    <th className="px-5 py-3 font-medium text-right">Total</th>
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 font-medium text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const isExpanded = expandedOrder === order.orderId;
                    const nextStatuses = VALID_TRANSITIONS[order.orderStatus] || [];
                    const isUpdating = updatingOrder === order.orderId;

                    return (
                      <AnimatePresence key={order.orderId}>
                        <tr
                          className={cn(
                            'border-b border-neutral-50 cursor-pointer transition-colors',
                            isExpanded ? 'bg-cream/50' : 'hover:bg-cream/30'
                          )}
                          onClick={() => setExpandedOrder(isExpanded ? null : order.orderId)}
                        >
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-semibold text-forest">{order.orderId}</span>
                              <span className="text-[10px] text-neutral-400">
                                {order.orderType === 'delivery' ? '🛵' : '🏪'}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <p className="text-sm font-medium text-neutral-700">{order.customerName}</p>
                            <p className="text-[11px] text-neutral-400">{order.customerPhone}</p>
                          </td>
                          <td className="px-5 py-3">
                            <OrderStatusBadge status={order.orderStatus} />
                          </td>
                          <td className="px-5 py-3">
                            <PaymentStatusBadge status={order.paymentStatus} />
                          </td>
                          <td className="px-5 py-3 text-sm font-semibold text-forest text-right">
                            {formatPrice(order.total)}
                          </td>
                          <td className="px-5 py-3 text-xs text-neutral-500 whitespace-nowrap">
                            {formatDateTime(order.createdAt)}
                          </td>
                          <td className="px-5 py-3 text-center">
                            <ChevronDownIcon className={cn('w-4 h-4 text-neutral-400 mx-auto transition-transform', isExpanded && 'rotate-180')} />
                          </td>
                        </tr>

                        {/* Expanded Order Details */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={7} className="px-5 py-0">
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="py-4 grid md:grid-cols-3 gap-4 border-b border-neutral-100">
                                  {/* Items */}
                                  <div>
                                    <p className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold mb-2">Items</p>
                                    <div className="space-y-1.5">
                                      {order.items.map((item, i) => (
                                        <div key={i} className="flex justify-between text-xs">
                                          <span className="text-neutral-700">
                                            <span className={item.isVeg ? 'text-veg' : 'text-nonveg'}>●</span>{' '}
                                            {item.productName} ({item.variantName}) × {item.quantity}
                                          </span>
                                          <span className="text-neutral-500 font-medium">{formatPrice(item.subtotal)}</span>
                                        </div>
                                      ))}
                                    </div>
                                    {order.notes && (
                                      <p className="text-xs text-neutral-400 italic mt-2">Note: {order.notes}</p>
                                    )}
                                  </div>

                                  {/* Address */}
                                  <div>
                                    <p className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold mb-2">
                                      {order.orderType === 'delivery' ? 'Delivery Address' : 'Pickup Order'}
                                    </p>
                                    {order.deliveryAddress ? (
                                      <p className="text-xs text-neutral-600 leading-relaxed">
                                        {order.deliveryAddress.houseFlat}, {order.deliveryAddress.street}<br />
                                        {order.deliveryAddress.area}, {order.deliveryAddress.city} - {order.deliveryAddress.pincode}
                                        {order.deliveryAddress.instructions && (
                                          <><br /><span className="italic text-neutral-400">Note: {order.deliveryAddress.instructions}</span></>
                                        )}
                                      </p>
                                    ) : (
                                      <p className="text-xs text-neutral-500">Self-pickup order</p>
                                    )}
                                  </div>

                                  {/* Quick Actions */}
                                  <div>
                                    <p className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold mb-2">Update Status</p>
                                    {nextStatuses.length > 0 ? (
                                      <div className="flex flex-wrap gap-2">
                                        {nextStatuses.map((ns) => (
                                          <Button
                                            key={ns}
                                            size="sm"
                                            variant={ns === 'cancelled' ? 'maroon' : 'primary'}
                                            isLoading={isUpdating}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleStatusUpdate(order.orderId, ns);
                                            }}
                                          >
                                            {STATUS_LABELS[ns] || ns}
                                          </Button>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-xs text-neutral-400">No further actions available.</p>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-neutral-100">
                <p className="text-xs text-neutral-500">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
