'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { getMyOrders, type OrderData } from '@/lib/api';
import { formatPrice, formatDateTime, cn } from '@/lib/utils';
import OrderStatusBadge from '@/components/admin/OrderStatusBadge';
import Button from '@/components/ui/Button';

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
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

export default function MyOrdersPage() {
  const { token, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [fetching, setFetching] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login?redirect=/account/orders');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!token) return;
    setFetching(true);
    getMyOrders(token, page).then(res => {
      if (res.success && res.data) {
        setOrders(res.data.orders);
        setTotalPages(res.data.pagination.totalPages);
      }
      setFetching(false);
    });
  }, [token, page]);

  if (isLoading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="w-8 h-8 border-[3px] border-forest/20 border-t-forest rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="container-main py-4 flex items-center gap-3">
          <Link href="/account" className="p-2 -ml-2 rounded-lg hover:bg-cream-dark transition-colors" aria-label="Back to account">
            <ArrowLeftIcon className="w-5 h-5 text-neutral-600" />
          </Link>
          <div>
            <h1 className="font-heading font-semibold text-xl text-forest">My Orders</h1>
            <p className="text-xs text-neutral-500">{orders.length} order{orders.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      <section className="py-6 pb-28 lg:pb-8">
        <div className="container-main max-w-3xl">
          {orders.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-neutral-100 flex items-center justify-center text-4xl">📦</div>
              <h2 className="font-heading font-semibold text-xl text-forest mb-2">No orders yet</h2>
              <p className="text-sm text-neutral-500 mb-6">When you place orders, they will appear here.</p>
              <Link href="/menu"><Button icon={<span>🍛</span>} iconPosition="left">Browse Menu</Button></Link>
            </motion.div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {orders.map((order, i) => {
                  const isExpanded = expanded === order.orderId;
                  return (
                    <motion.div
                      key={order.orderId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="bg-white rounded-2xl shadow-soft overflow-hidden"
                    >
                      {/* Order Header */}
                      <button
                        onClick={() => setExpanded(isExpanded ? null : order.orderId)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-cream/30 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 flex-1 min-w-0">
                          <div>
                            <p className="font-mono text-sm font-bold text-forest">{order.orderId}</p>
                            <p className="text-xs text-neutral-400">{formatDateTime(order.createdAt)}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <OrderStatusBadge status={order.orderStatus} />
                            <span className="text-xs bg-cream px-2 py-0.5 rounded-full text-neutral-500">
                              {order.orderType === 'delivery' ? '🛵 Delivery' : '🏪 Pickup'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                          <span className="price text-lg">{formatPrice(order.total)}</span>
                          <ChevronDownIcon className={cn('w-4 h-4 text-neutral-400 transition-transform', isExpanded && 'rotate-180')} />
                        </div>
                      </button>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-neutral-100 px-4 py-4"
                        >
                          <div className="space-y-2 mb-4">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span className="text-neutral-700">
                                  <span className={item.isVeg ? 'text-veg' : 'text-nonveg'}>●</span>{' '}
                                  {item.productName} ({item.variantName}) × {item.quantity}
                                </span>
                                <span className="font-medium text-neutral-600">{formatPrice(item.subtotal)}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                            <div className="text-xs text-neutral-500">
                              {order.discount > 0 && <p className="text-veg">Discount: -{formatPrice(order.discount)}</p>}
                              {order.couponCode && <p>Coupon: {order.couponCode}</p>}
                            </div>
                            <Link href={`/order/${order.orderId}`}>
                              <Button size="sm" variant="outline">Track Order</Button>
                            </Link>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-3 pt-4">
                  <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                  <span className="flex items-center text-sm text-neutral-500">Page {page} of {totalPages}</span>
                  <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
