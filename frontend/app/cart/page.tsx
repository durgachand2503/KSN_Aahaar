'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { formatPrice, cn } from '@/lib/utils';
import { DELIVERY_DEFAULTS } from '@/lib/constants';
import Button from '@/components/ui/Button';

/* ── Icons ── */
function MinusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M5 12h14" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}

function ShoppingBagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

export default function CartPage() {
  const { items, subtotal, deliveryFee, discount, total, itemCount, updateQuantity, removeItem, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <section className="py-16 lg:py-24">
        <div className="container-main">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md mx-auto"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-neutral-100 flex items-center justify-center">
              <ShoppingBagIcon className="w-11 h-11 text-neutral-300" />
            </div>
            <h1 className="font-heading font-bold text-2xl lg:text-3xl text-forest mb-3">Your Cart is Empty</h1>
            <p className="text-body mb-8">
              Looks like you haven&apos;t added any delicious items yet. Browse our menu and find something you love!
            </p>
            <Link href="/menu">
              <Button size="lg" icon={<ArrowRightIcon className="w-5 h-5" />} iconPosition="right">
                Browse Menu
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="container-main py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/menu" className="p-2 -ml-2 rounded-lg hover:bg-cream-dark transition-colors" aria-label="Back to menu">
              <ArrowLeftIcon className="w-5 h-5 text-neutral-600" />
            </Link>
            <div>
              <h1 className="font-heading font-semibold text-xl text-forest">Your Cart</h1>
              <p className="text-xs text-neutral-500">{itemCount} {itemCount === 1 ? 'item' : 'items'}</p>
            </div>
          </div>
          <button
            onClick={clearCart}
            className="text-xs text-neutral-400 hover:text-red-500 font-medium transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>

      <section className="py-6 pb-40 lg:pb-6">
        <div className="container-main">
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-3">
              <AnimatePresence initial={false}>
                {items.map((item) => (
                  <motion.div
                    key={`${item.productId}-${item.variantId}`}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -40, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.25 }}
                    className="bg-white rounded-xl p-4 shadow-soft"
                  >
                    <div className="flex gap-4">
                      {/* Image */}
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden flex-shrink-0 bg-neutral-100">
                        <Image
                          src={item.image}
                          alt={item.productName}
                          fill
                          sizes="96px"
                          className="object-cover"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={cn(
                                'w-3 h-3 rounded-sm border flex-shrink-0',
                                item.isVeg ? 'border-veg' : 'border-nonveg'
                              )}>
                                <span className={cn(
                                  'block w-1.5 h-1.5 rounded-full mx-auto mt-[2px]',
                                  item.isVeg ? 'bg-veg' : 'bg-nonveg'
                                )} />
                              </span>
                              <h3 className="text-sm sm:text-base font-semibold text-forest truncate">{item.productName}</h3>
                            </div>
                            <p className="text-xs text-neutral-500">{item.variantName} · {formatPrice(item.price)} each</p>
                          </div>
                          <button
                            onClick={() => removeItem(item.productId, item.variantId)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-colors flex-shrink-0"
                            aria-label={`Remove ${item.productName}`}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Price & Quantity */}
                        <div className="flex items-center justify-between mt-3">
                          <span className="price text-base sm:text-lg">{formatPrice(item.price * item.quantity)}</span>
                          <div className="flex items-center gap-0.5 bg-cream-dark rounded-lg">
                            <button
                              onClick={() =>
                                item.quantity <= 1
                                  ? removeItem(item.productId, item.variantId)
                                  : updateQuantity(item.productId, item.variantId, item.quantity - 1)
                              }
                              className="w-9 h-9 flex items-center justify-center text-forest hover:bg-neutral-200 rounded-l-lg transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <MinusIcon className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-9 h-9 flex items-center justify-center text-forest text-sm font-bold">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                              className="w-9 h-9 flex items-center justify-center text-forest hover:bg-neutral-200 rounded-r-lg transition-colors"
                              aria-label="Increase quantity"
                            >
                              <PlusIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Continue Shopping */}
              <div className="text-center pt-4">
                <Link href="/menu" className="inline-flex items-center gap-2 text-sm text-forest font-medium hover:text-forest-light transition-colors">
                  <ArrowLeftIcon className="w-4 h-4" />
                  Continue Shopping
                </Link>
              </div>
            </div>

            {/* Order Summary (Desktop sidebar / Mobile bottom bar) */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl p-5 shadow-soft sticky top-24">
                <h2 className="font-heading font-semibold text-lg text-forest mb-4">Order Summary</h2>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-neutral-600">
                    <span>Subtotal ({itemCount} items)</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Delivery Fee</span>
                    <span className={cn('font-medium', deliveryFee === 0 && 'text-veg')}>
                      {deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}
                    </span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-veg">
                      <span>Discount</span>
                      <span className="font-medium">-{formatPrice(discount)}</span>
                    </div>
                  )}
                </div>

                {/* Free delivery nudge */}
                {deliveryFee > 0 && (
                  <div className="mt-3 p-3 bg-gold/5 rounded-lg">
                    <p className="text-[11px] text-gold-dark text-center">
                      Add {formatPrice(DELIVERY_DEFAULTS.freeThreshold - subtotal)} more for <strong>free delivery</strong>!
                    </p>
                    <div className="mt-2 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gold rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (subtotal / DELIVERY_DEFAULTS.freeThreshold) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Minimum order */}
                {subtotal < DELIVERY_DEFAULTS.minOrder && (
                  <p className="mt-3 text-[11px] text-red-500 bg-red-50 px-3 py-2 rounded-lg text-center">
                    Minimum order of {formatPrice(DELIVERY_DEFAULTS.minOrder)} required for checkout.
                  </p>
                )}

                <div className="flex justify-between items-center mt-4 pt-4 border-t border-neutral-100">
                  <span className="text-base font-semibold text-forest">Total</span>
                  <span className="price text-2xl">{formatPrice(total)}</span>
                </div>

                <Link href="/checkout" className="block mt-4">
                  <Button
                    fullWidth
                    size="lg"
                    variant="gold"
                    disabled={subtotal < DELIVERY_DEFAULTS.minOrder}
                    icon={<ArrowRightIcon className="w-5 h-5" />}
                    iconPosition="right"
                  >
                    Proceed to Checkout
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Fixed Bottom CTA */}
      <div className="fixed bottom-16 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-neutral-200 p-4 lg:hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-neutral-600">Total</span>
          <span className="price text-xl">{formatPrice(total)}</span>
        </div>
        <Link href="/checkout">
          <Button
            fullWidth
            size="lg"
            variant="gold"
            disabled={subtotal < DELIVERY_DEFAULTS.minOrder}
            icon={<ArrowRightIcon className="w-5 h-5" />}
            iconPosition="right"
          >
            Proceed to Checkout
          </Button>
        </Link>
      </div>
    </>
  );
}
