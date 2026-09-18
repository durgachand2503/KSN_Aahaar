'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { getAdminOrders, updateOrderStatus, type OrderData } from '@/lib/api';
import { formatPrice, formatDateTime, cn } from '@/lib/utils';
import OrderStatusBadge, { PaymentStatusBadge } from '@/components/admin/OrderStatusBadge';
import Button from '@/components/ui/Button';

/* ── Valid status transitions (mirrors backend) ── */
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
  placed: 'Placed', payment_pending: 'Pay Pending', payment_confirmed: 'Paid',
  payment_failed: 'Pay Failed', accepted: 'Accepted', preparing: 'Preparing',
  ready: 'Ready', out_for_delivery: 'Out for Delivery', delivered: 'Delivered',
  cancelled: 'Cancelled', refund_pending: 'Refund Pending', refunded: 'Refunded',
};

/* Active statuses — the default view during kitchen operations */
const ACTIVE_STATUSES = ['placed', 'payment_pending', 'payment_confirmed', 'accepted', 'preparing', 'ready', 'out_for_delivery'];
const STATUS_FILTERS = ['active', 'all', 'placed', 'payment_confirmed', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];

/* ── Icons ── */
const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
  </svg>
);
const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6" />
  </svg>
);
const PhoneIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.54 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.16 6.16l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);
const MapPinIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
  </svg>
);
const ClockHistoryIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l4 2" />
  </svg>
);
const RefreshIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" />
  </svg>
);

/* ── Status confirm modal ── */
function StatusConfirmModal({
  currentStatus, nextStatus, onConfirm, onCancel, isLoading,
}: {
  currentStatus: string; nextStatus: string;
  onConfirm: (note: string) => void; onCancel: () => void; isLoading: boolean;
}) {
  const [note, setNote] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setTimeout(() => textareaRef.current?.focus(), 100); }, []);

  const isCancel = nextStatus === 'cancelled';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onCancel}>
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl w-full max-w-sm shadow-modal border border-neutral-100 overflow-hidden"
        onClick={e => e.stopPropagation()}>
        <div className={cn('h-1', isCancel ? 'bg-maroon' : 'bg-forest')} />
        <div className="p-6">
          <h3 className="font-heading font-bold text-lg text-neutral-800 mb-1">
            {isCancel ? 'Cancel Order?' : 'Update Status?'}
          </h3>
          <p className="text-sm text-neutral-500 mb-4">
            Change from <span className="font-semibold text-neutral-700">{STATUS_LABELS[currentStatus]}</span> →{' '}
            <span className={cn('font-semibold', isCancel ? 'text-maroon' : 'text-forest')}>{STATUS_LABELS[nextStatus]}</span>
          </p>
          <div className="mb-5">
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
              {isCancel ? 'Reason (required for cancellation)' : 'Note (optional)'}
            </label>
            <textarea
              ref={textareaRef}
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder={isCancel ? 'e.g. Customer requested, out of stock…' : 'e.g. Ready on time, delivered at gate…'}
              rows={3}
              className="w-full px-3.5 py-2.5 text-sm bg-cream border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all resize-none placeholder:text-neutral-300"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={onCancel} disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button
              onClick={() => onConfirm(note)}
              disabled={isLoading || (isCancel && !note.trim())}
              className={cn(
                'flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2',
                isCancel ? 'bg-maroon hover:bg-maroon-dark' : 'bg-forest hover:bg-forest-light'
              )}>
              {isLoading && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {isLoading ? 'Updating…' : 'Confirm'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Expanded order detail panel ── */
function OrderDetail({
  order, onStatusUpdate, isUpdating,
}: {
  order: OrderData; onStatusUpdate: (status: string, note: string) => void; isUpdating: boolean;
}) {
  const nextStatuses = VALID_TRANSITIONS[order.orderStatus] || [];
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
        className="overflow-hidden">
        <div className="border-t border-neutral-100 bg-cream/30">
          <div className="px-5 py-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">

            {/* ── Col 1: Customer ── */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Customer</p>
              <div className="bg-white rounded-xl p-3.5 border border-neutral-100 space-y-2.5">
                <div>
                  <p className="font-semibold text-sm text-neutral-800">{order.customerName}</p>
                  {order.customerEmail && (
                    <p className="text-[11px] text-neutral-400 truncate">{order.customerEmail}</p>
                  )}
                </div>
                <a href={`tel:${order.customerPhone}`}
                  className="flex items-center gap-2 px-3 py-2 bg-forest/8 hover:bg-forest/15 text-forest rounded-lg transition-colors group">
                  <PhoneIcon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-sm font-bold tracking-wide">{order.customerPhone}</span>
                </a>
                <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                  <span className={cn('w-1.5 h-1.5 rounded-full', order.orderType === 'delivery' ? 'bg-blue-400' : 'bg-gold')} />
                  {order.orderType === 'delivery' ? '🛵 Delivery' : '🏪 Pickup'}
                  {order.scheduledTime && (
                    <span className="ml-1 text-gold-dark font-medium">⏰ Scheduled</span>
                  )}
                </div>
              </div>
            </div>

            {/* ── Col 2: Items + Address ── */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                Order Items ({order.items.length})
              </p>
              <div className="bg-white rounded-xl p-3.5 border border-neutral-100 space-y-2">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-start justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0 mt-0.5', item.isVeg ? 'bg-veg' : 'bg-nonveg')} />
                      <span className="text-neutral-700 leading-tight">
                        {item.productName} <span className="text-neutral-400">({item.variantName})</span>
                        {item.quantity > 1 && <span className="font-semibold text-neutral-600"> ×{item.quantity}</span>}
                      </span>
                    </div>
                    <span className="text-neutral-600 font-semibold flex-shrink-0">{formatPrice(item.subtotal)}</span>
                  </div>
                ))}
                {order.notes && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5 italic mt-1">
                    📝 {order.notes}
                  </p>
                )}
              </div>

              {/* Address */}
              {order.deliveryAddress && (
                <div className="bg-white rounded-xl p-3.5 border border-neutral-100">
                  <div className="flex items-start gap-2">
                    <MapPinIcon className="w-3.5 h-3.5 text-neutral-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      {order.deliveryAddress.houseFlat}, {order.deliveryAddress.street}<br />
                      {order.deliveryAddress.area}, {order.deliveryAddress.city} – {order.deliveryAddress.pincode}
                      {order.deliveryAddress.instructions && (
                        <><br /><span className="text-amber-700 italic">🔔 {order.deliveryAddress.instructions}</span></>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ── Col 3: Order Totals + Status History ── */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Bill Summary</p>
              <div className="bg-white rounded-xl p-3.5 border border-neutral-100 space-y-1.5">
                <div className="flex justify-between text-xs text-neutral-600">
                  <span>Subtotal</span><span className="font-medium">{formatPrice(order.subtotal)}</span>
                </div>
                {order.deliveryFee > 0 && (
                  <div className="flex justify-between text-xs text-neutral-600">
                    <span>Delivery</span><span className="font-medium">{formatPrice(order.deliveryFee)}</span>
                  </div>
                )}
                {order.discount > 0 && (
                  <div className="flex justify-between text-xs text-veg">
                    <span>Discount {order.couponCode && <span className="font-mono text-[10px] bg-veg/10 px-1 rounded">({order.couponCode})</span>}</span>
                    <span className="font-medium">–{formatPrice(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-forest border-t border-neutral-100 pt-1.5 mt-0.5">
                  <span>Total</span><span>{formatPrice(order.total)}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wide">Payment</span>
                  <PaymentStatusBadge status={order.paymentStatus} />
                </div>
              </div>

              {/* Status history */}
              {order.statusHistory && order.statusHistory.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2 flex items-center gap-1">
                    <ClockHistoryIcon className="w-3 h-3" /> History
                  </p>
                  <div className="bg-white rounded-xl border border-neutral-100 divide-y divide-neutral-50 max-h-44 overflow-y-auto">
                    {[...order.statusHistory].reverse().map((h, i) => (
                      <div key={i} className="px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <OrderStatusBadge status={h.status} />
                          <span className="text-[10px] text-neutral-400 flex-shrink-0">{formatDateTime(h.timestamp)}</span>
                        </div>
                        {h.note && <p className="text-[11px] text-neutral-500 italic mt-0.5 pl-0.5">{h.note}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Col 4: Update Status ── */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Update Status</p>
              {nextStatuses.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {nextStatuses.map(ns => (
                    <button
                      key={ns}
                      onClick={() => setPendingStatus(ns)}
                      disabled={isUpdating}
                      className={cn(
                        'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 border',
                        ns === 'cancelled'
                          ? 'bg-maroon/8 text-maroon border-maroon/20 hover:bg-maroon/15'
                          : 'bg-forest/8 text-forest border-forest/20 hover:bg-forest/15'
                      )}>
                      {isUpdating ? <div className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" /> : null}
                      → {STATUS_LABELS[ns] || ns}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl p-3.5 border border-neutral-100 text-center">
                  <p className="text-2xl mb-1">
                    {order.orderStatus === 'delivered' ? '✅' : order.orderStatus === 'refunded' ? '💰' : '🔒'}
                  </p>
                  <p className="text-xs text-neutral-400 font-medium">
                    {order.orderStatus === 'delivered' ? 'Order completed' : 'Order finalised'}
                  </p>
                </div>
              )}

              {/* WhatsApp link */}
              {order.customerPhone && (
                <a
                  href={`https://wa.me/91${order.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Hi ${order.customerName}, your KSN Aahaar order #${order.orderId} is now *${STATUS_LABELS[order.orderStatus]}*. Thank you! 🙏`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-[#25D366]/10 text-[#128C7E] border border-[#25D366]/20 hover:bg-[#25D366]/20 text-xs font-semibold transition-colors">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.555 4.115 1.524 5.836L0 24l6.335-1.524A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.773 9.773 0 0 1-4.992-1.367l-.358-.213-3.717.975.992-3.618-.234-.372A9.773 9.773 0 0 1 2.182 12C2.182 6.58 6.58 2.182 12 2.182S21.818 6.58 21.818 12 17.42 21.818 12 21.818z" />
                  </svg>
                  WhatsApp Customer
                </a>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Status confirm modal */}
      <AnimatePresence>
        {pendingStatus && (
          <StatusConfirmModal
            currentStatus={order.orderStatus}
            nextStatus={pendingStatus}
            isLoading={isUpdating}
            onCancel={() => setPendingStatus(null)}
            onConfirm={(note) => {
              onStatusUpdate(pendingStatus, note);
              setPendingStatus(null);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* ── Main Page ── */
export default function AdminOrdersPage() {
  const { isAuthenticated } = useAdminAuth();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('active');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);

    // "active" pseudo-filter: fetch multiple statuses
    const apiStatus = statusFilter === 'active' ? undefined : statusFilter === 'all' ? undefined : statusFilter;
    const result = await getAdminOrders('', { status: apiStatus, page, search: search || undefined });

    if (result.success && result.data) {
      let orders = result.data.orders;
      // Client-side filter for "active" pseudo-filter
      if (statusFilter === 'active') {
        orders = orders.filter(o => ACTIVE_STATUSES.includes(o.orderStatus));
      }
      setOrders(orders);
      setTotal(result.data.pagination.total);
      setTotalPages(result.data.pagination.totalPages);
    } else if (!result.success) {
      setError(result.error || 'Failed to load orders');
    }
    setLoading(false);
  }, [isAuthenticated, statusFilter, page, search]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => { setPage(1); }, [statusFilter, search]);

  // Auto-refresh every 30s for active orders
  useEffect(() => {
    if (statusFilter !== 'active') return;
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [fetchOrders, statusFilter]);

  const handleStatusUpdate = async (orderId: string, newStatus: string, note: string) => {
    if (!isAuthenticated) return;
    setUpdatingOrder(orderId);
    const result = await updateOrderStatus(orderId, newStatus, '', note);
    if (result.success && result.data) {
      setOrders(prev => prev.map(o => o.orderId === orderId ? result.data! : o));
      // If active filter and order moved to terminal state, remove it
      if (statusFilter === 'active' && !ACTIVE_STATUSES.includes(newStatus)) {
        setOrders(prev => prev.filter(o => o.orderId !== orderId));
      }
    }
    setUpdatingOrder(null);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-heading font-bold text-2xl text-forest">Orders</h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            {loading ? 'Loading…' : `${total} order${total !== 1 ? 's' : ''} ${statusFilter === 'active' ? '· live kitchen view' : ''}`}
          </p>
        </div>
        <button
          onClick={fetchOrders}
          title="Refresh orders"
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-neutral-200 text-sm font-medium text-neutral-500 hover:bg-cream hover:text-forest transition-all shadow-soft">
          <RefreshIcon className={cn('w-4 h-4', loading && 'animate-spin')} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-neutral-100 shadow-soft p-4 mb-5 space-y-3">
        <div className="relative">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by Order ID, name, or phone…"
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-cream border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-colors placeholder:text-neutral-400"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {STATUS_FILTERS.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={cn(
                'px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide rounded-lg whitespace-nowrap transition-all flex-shrink-0',
                statusFilter === s ? 'bg-forest text-white shadow-sm' : 'bg-cream text-neutral-500 hover:bg-cream-dark'
              )}>
              {s === 'active' ? '🟢 Live' : s === 'all' ? 'All' : STATUS_LABELS[s] || s}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-neutral-100 shadow-soft overflow-hidden">
        {loading ? (
          <div className="p-14 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-forest/20 border-t-forest rounded-full animate-spin" />
            <p className="text-sm text-neutral-400">Loading orders…</p>
          </div>
        ) : error ? (
          <div className="p-14 text-center">
            <p className="text-4xl mb-3">⚠️</p>
            <p className="text-neutral-600 font-medium text-sm mb-2">{error}</p>
            <button onClick={fetchOrders} className="text-xs text-forest font-semibold hover:underline">Try again</button>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-14 text-center">
            <p className="text-4xl mb-3">{statusFilter === 'active' ? '🎉' : '📋'}</p>
            <p className="text-neutral-600 font-semibold text-sm">
              {statusFilter === 'active' ? 'No active orders right now' : 'No orders found'}
            </p>
            {statusFilter === 'active' && (
              <p className="text-neutral-400 text-xs mt-1">New orders will appear here automatically</p>
            )}
          </div>
        ) : (
          <>
            {/* ── Desktop Table ── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-[11px] text-neutral-400 uppercase tracking-wider bg-cream/50 border-b border-neutral-100">
                    <th className="px-5 py-3 font-semibold">Order</th>
                    <th className="px-5 py-3 font-semibold">Customer</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Payment</th>
                    <th className="px-5 py-3 font-semibold text-right">Total</th>
                    <th className="px-5 py-3 font-semibold">Date</th>
                    <th className="px-5 py-3 font-semibold w-10" />
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, idx) => {
                    const isExpanded = expandedOrder === order.orderId;
                    const isUpdating = updatingOrder === order.orderId;
                    const rowKey = (order as { id?: string }).id || order.orderId || String(idx);
                    return (
                      <React.Fragment key={rowKey}>
                        <tr
                          onClick={() => setExpandedOrder(isExpanded ? null : order.orderId)}
                          className={cn('border-b border-neutral-50 cursor-pointer transition-colors',
                            isExpanded ? 'bg-cream/60' : 'hover:bg-cream/40'
                          )}>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-sm font-bold text-forest">{order.orderId}</span>
                              <span className="text-neutral-300">{order.orderType === 'delivery' ? '🛵' : '🏪'}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="text-sm font-medium text-neutral-700">{order.customerName}</p>
                            <p className="text-[11px] text-neutral-400">{order.customerPhone}</p>
                          </td>
                          <td className="px-5 py-3.5"><OrderStatusBadge status={order.orderStatus} /></td>
                          <td className="px-5 py-3.5"><PaymentStatusBadge status={order.paymentStatus} /></td>
                          <td className="px-5 py-3.5 text-sm font-bold text-forest text-right">{formatPrice(order.total)}</td>
                          <td className="px-5 py-3.5 text-xs text-neutral-400 whitespace-nowrap">{formatDateTime(order.createdAt)}</td>
                          <td className="px-5 py-3.5">
                            <ChevronDownIcon className={cn('w-4 h-4 text-neutral-300 transition-transform mx-auto', isExpanded && 'rotate-180')} />
                          </td>
                        </tr>
                        <AnimatePresence>
                          {isExpanded && (
                            <tr key={`${rowKey}-detail`}><td colSpan={7} className="p-0">
                              <OrderDetail
                                order={order}
                                onStatusUpdate={(s, note) => handleStatusUpdate(order.orderId, s, note)}
                                isUpdating={isUpdating} />
                            </td></tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Mobile Cards ── */}
            <div className="md:hidden divide-y divide-neutral-50">
              {orders.map(order => {
                const isExpanded = expandedOrder === order.orderId;
                const isUpdating = updatingOrder === order.orderId;
                return (
                  <div key={order.orderId} className={cn('transition-colors', isExpanded && 'bg-cream/30')}>
                    <button className="w-full text-left px-4 py-3.5"
                      onClick={() => setExpandedOrder(isExpanded ? null : order.orderId)}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-mono text-sm font-bold text-forest">{order.orderId}</span>
                            <span className="text-xs">{order.orderType === 'delivery' ? '🛵' : '🏪'}</span>
                          </div>
                          <p className="text-xs text-neutral-600 truncate">{order.customerName} · {order.customerPhone}</p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            <OrderStatusBadge status={order.orderStatus} />
                            <PaymentStatusBadge status={order.paymentStatus} />
                          </div>
                        </div>
                        <div className="flex flex-col items-end flex-shrink-0 gap-1">
                          <span className="text-sm font-bold text-forest">{formatPrice(order.total)}</span>
                          <span className="text-[10px] text-neutral-400">{formatDateTime(order.createdAt)}</span>
                          <ChevronDownIcon className={cn('w-4 h-4 text-neutral-300 transition-transform mt-1', isExpanded && 'rotate-180')} />
                        </div>
                      </div>
                    </button>
                    <AnimatePresence>
                      {isExpanded && (
                        <OrderDetail
                          order={order}
                          onStatusUpdate={(s, note) => handleStatusUpdate(order.orderId, s, note)}
                          isUpdating={isUpdating} />
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-neutral-100">
                <p className="text-xs text-neutral-400">Page {page} of {totalPages}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</Button>
                  <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
