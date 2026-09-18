'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { getOrder, type OrderData } from '@/lib/api';
import { formatPrice, formatDateTime, cn } from '@/lib/utils';
import { BRAND } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';

/* ── Status Configuration ── */
const STATUS_CONFIG: Record<string, { label: string; emoji: string; color: string; bgColor: string }> = {
  placed: { label: 'Order Placed', emoji: '📝', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  payment_pending: { label: 'Payment Pending', emoji: '⏳', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  payment_confirmed: { label: 'Payment Confirmed', emoji: '✅', color: 'text-green-600', bgColor: 'bg-green-100' },
  payment_failed: { label: 'Payment Failed', emoji: '❌', color: 'text-red-600', bgColor: 'bg-red-100' },
  accepted: { label: 'Accepted by Kitchen', emoji: '👨‍🍳', color: 'text-forest', bgColor: 'bg-forest/10' },
  preparing: { label: 'Being Prepared', emoji: '🔥', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  ready: { label: 'Ready', emoji: '📦', color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  out_for_delivery: { label: 'Out for Delivery', emoji: '🛵', color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  delivered: { label: 'Delivered', emoji: '🎉', color: 'text-green-700', bgColor: 'bg-green-100' },
  cancelled: { label: 'Cancelled', emoji: '🚫', color: 'text-red-600', bgColor: 'bg-red-100' },
  refund_pending: { label: 'Refund Pending', emoji: '💸', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  refunded: { label: 'Refunded', emoji: '💰', color: 'text-green-600', bgColor: 'bg-green-100' },
};

/* ── Active order flow for timeline ── */
const ORDER_FLOW_DELIVERY = ['placed', 'payment_confirmed', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered'];
const ORDER_FLOW_PICKUP = ['placed', 'payment_confirmed', 'accepted', 'preparing', 'ready', 'delivered'];

function getStatusInfo(status: string) {
  return STATUS_CONFIG[status] || { label: status, emoji: '📋', color: 'text-neutral-600', bgColor: 'bg-neutral-100' };
}

/* ── Icons ── */
function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

export default function OrderTrackingPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const { token } = useAuth();

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    const result = await getOrder(orderId, token);
    if (result.success && result.data) {
      setOrder(result.data);
      setError(null);
    } else {
      setError(result.error || 'Order not found');
    }
    setLoading(false);
  }, [orderId, token]);

  useEffect(() => {
    fetchOrder();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchOrder, 30000);
    return () => clearInterval(interval);
  }, [fetchOrder]);

  if (loading) {
    return (
      <section className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-[3px] border-forest/20 border-t-forest rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-neutral-500">Loading order details...</p>
        </div>
      </section>
    );
  }

  if (error || !order) {
    return (
      <section className="py-16 lg:py-24">
        <div className="container-main text-center max-w-md mx-auto">
          <p className="text-4xl mb-4">🔍</p>
          <h1 className="font-heading font-bold text-2xl text-forest mb-3">Order Not Found</h1>
          <p className="text-body text-sm mb-8">{error || 'We could not find this order. Please check the order ID.'}</p>
          <Link href="/menu">
            <Button>Browse Menu</Button>
          </Link>
        </div>
      </section>
    );
  }

  const statusInfo = getStatusInfo(order.orderStatus);
  const isTerminal = ['delivered', 'cancelled', 'refunded'].includes(order.orderStatus);
  const orderFlow = order.orderType === 'pickup' ? ORDER_FLOW_PICKUP : ORDER_FLOW_DELIVERY;
  const currentFlowIndex = orderFlow.indexOf(order.orderStatus);

  // Build WhatsApp support link
  const whatsappMsg = encodeURIComponent(
    `Hi KSN AAHAAR, I have a question about my order ${order.orderId}.`
  );
  const whatsappLink = `https://wa.me/${BRAND.whatsapp.replace(/[^0-9]/g, '')}?text=${whatsappMsg}`;

  return (
    <>
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="container-main py-4">
          <div className="flex items-center gap-3">
            <Link href="/menu" className="p-2 -ml-2 rounded-lg hover:bg-cream-dark transition-colors">
              <ArrowLeftIcon className="w-5 h-5 text-neutral-600" />
            </Link>
            <div>
              <h1 className="font-heading font-semibold text-lg text-forest">Order {order.orderId}</h1>
              <p className="text-xs text-neutral-500">{formatDateTime(order.createdAt)}</p>
            </div>
          </div>
        </div>
      </div>

      <section className="py-6">
        <div className="container-main max-w-3xl mx-auto">
          {/* Current Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-card p-6 mb-6 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className={cn('w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3', statusInfo.bgColor)}
            >
              <span className="text-3xl">{statusInfo.emoji}</span>
            </motion.div>
            <h2 className={cn('font-heading font-bold text-xl mb-1', statusInfo.color)}>
              {statusInfo.label}
            </h2>
            <p className="text-sm text-neutral-500">
              {order.orderStatus === 'preparing' && 'Your food is being prepared with love!'}
              {order.orderStatus === 'ready' && (order.orderType === 'pickup' ? 'Your order is ready for pickup!' : 'Your order is ready and will be picked up by delivery soon.')}
              {order.orderStatus === 'out_for_delivery' && 'Your food is on its way to you!'}
              {order.orderStatus === 'delivered' && 'Enjoy your meal! Thank you for ordering.'}
              {order.orderStatus === 'placed' && 'We have received your order.'}
              {order.orderStatus === 'payment_confirmed' && 'Payment received. Kitchen will start soon.'}
              {order.orderStatus === 'accepted' && 'Kitchen has accepted your order.'}
              {order.orderStatus === 'cancelled' && 'This order has been cancelled.'}
            </p>

            {!isTerminal && (
              <p className="text-xs text-neutral-400 mt-3 animate-pulse">
                Auto-refreshing every 30 seconds
              </p>
            )}
          </motion.div>

          {/* Status Timeline */}
          {!['cancelled', 'payment_failed'].includes(order.orderStatus) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-soft p-6 mb-6"
            >
              <h3 className="font-heading font-semibold text-sm text-forest mb-5">Order Progress</h3>
              <div className="space-y-0">
                {orderFlow.map((flowStatus, i) => {
                  const info = getStatusInfo(flowStatus);
                  const isReached = currentFlowIndex >= i;
                  const isCurrent = currentFlowIndex === i;
                  const historyEntry = order.statusHistory.find((h) => h.status === flowStatus);

                  return (
                    <div key={flowStatus} className="flex gap-3">
                      {/* Timeline dot and line */}
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all',
                            isCurrent
                              ? 'bg-forest text-white shadow-md ring-4 ring-forest/20'
                              : isReached
                              ? 'bg-veg text-white'
                              : 'bg-neutral-200 text-neutral-400'
                          )}
                        >
                          <span className="text-sm">{info.emoji}</span>
                        </div>
                        {i < orderFlow.length - 1 && (
                          <div
                            className={cn(
                              'w-0.5 h-8 my-0.5',
                              isReached && currentFlowIndex > i ? 'bg-veg' : 'bg-neutral-200'
                            )}
                          />
                        )}
                      </div>

                      {/* Content */}
                      <div className="pb-4 pt-1">
                        <p
                          className={cn(
                            'text-sm font-medium',
                            isCurrent ? 'text-forest' : isReached ? 'text-neutral-700' : 'text-neutral-400'
                          )}
                        >
                          {info.label}
                        </p>
                        {historyEntry && (
                          <p className="text-[11px] text-neutral-400 mt-0.5">
                            {formatDateTime(historyEntry.timestamp)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Order Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-soft p-6 mb-6"
          >
            <h3 className="font-heading font-semibold text-sm text-forest mb-4">Order Items</h3>
            <div className="space-y-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-100">
                    <Image src={item.image} alt={item.productName} fill sizes="48px" className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={item.isVeg ? 'badge-veg' : 'badge-nonveg'} />
                      <p className="text-sm font-medium text-forest truncate">{item.productName}</p>
                    </div>
                    <p className="text-xs text-neutral-500">{item.variantName} × {item.quantity}</p>
                  </div>
                  <span className="text-sm font-semibold text-forest">{formatPrice(item.subtotal)}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-4 pt-4 border-t border-neutral-100 space-y-1.5 text-sm">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Delivery</span>
                <span className={order.deliveryFee === 0 ? 'text-veg font-medium' : ''}>
                  {order.orderType === 'pickup' ? 'N/A' : order.deliveryFee === 0 ? 'FREE' : formatPrice(order.deliveryFee)}
                </span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-veg">
                  <span>Discount</span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-forest text-base pt-2 border-t border-neutral-100">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </motion.div>

          {/* Delivery / Pickup Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-soft p-6 mb-6"
          >
            <h3 className="font-heading font-semibold text-sm text-forest mb-3">
              {order.orderType === 'delivery' ? 'Delivery Address' : 'Pickup Location'}
            </h3>
            {order.orderType === 'delivery' && order.deliveryAddress ? (
              <div className="text-sm text-neutral-600">
                <p>{order.deliveryAddress.houseFlat}, {order.deliveryAddress.street}</p>
                <p>{order.deliveryAddress.area}, {order.deliveryAddress.city} - {order.deliveryAddress.pincode}</p>
                {order.deliveryAddress.instructions && (
                  <p className="text-xs text-neutral-400 mt-1 italic">Note: {order.deliveryAddress.instructions}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-neutral-600">{BRAND.location}</p>
            )}
          </motion.div>

          {/* Contact / Support */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-3 justify-center items-center"
          >
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="md" icon={<WhatsAppSmallIcon className="w-4 h-4" />}>
                WhatsApp Support
              </Button>
            </a>
            <a href={`tel:${BRAND.phone}`}>
              <Button variant="ghost" size="md" icon={<PhoneIcon className="w-4 h-4" />}>
                Call Us
              </Button>
            </a>
          </motion.div>
        </div>
      </section>
    </>
  );
}

function WhatsAppSmallIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
