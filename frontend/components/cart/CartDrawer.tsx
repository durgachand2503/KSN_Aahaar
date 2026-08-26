'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { formatPrice, cn } from '@/lib/utils';
import { DELIVERY_DEFAULTS } from '@/lib/constants';
import Button from '@/components/ui/Button';

/* ── Icons ── */
function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

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

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, subtotal, deliveryFee, discount, total, itemCount, updateQuantity, removeItem, clearCart } = useCart();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[1040]"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            ref={drawerRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-cream z-[1050] flex flex-col shadow-modal"
            role="dialog"
            aria-label="Shopping cart"
            aria-modal="true"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-white">
              <div className="flex items-center gap-3">
                <ShoppingBagIcon className="w-5 h-5 text-forest" />
                <h2 className="font-heading font-semibold text-lg text-forest">
                  Your Cart
                </h2>
                {itemCount > 0 && (
                  <span className="px-2 py-0.5 bg-forest text-white text-[11px] font-bold rounded-full">
                    {itemCount}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-cream-dark transition-colors"
                aria-label="Close cart"
              >
                <CloseIcon className="w-5 h-5 text-neutral-600" />
              </button>
            </div>

            {/* Cart Items */}
            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
                  <ShoppingBagIcon className="w-9 h-9 text-neutral-300" />
                </div>
                <h3 className="font-heading font-semibold text-lg text-forest mb-2">Your cart is empty</h3>
                <p className="text-sm text-neutral-500 mb-6 max-w-xs">
                  Looks like you haven&apos;t added any items yet. Explore our menu to get started!
                </p>
                <Link href="/menu" onClick={onClose}>
                  <Button icon={<ArrowRightIcon className="w-4 h-4" />} iconPosition="right">
                    Browse Menu
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                {/* Items List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <motion.div
                        key={`${item.productId}-${item.variantId}`}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white rounded-xl p-3 shadow-soft"
                      >
                        <div className="flex gap-3">
                          {/* Image */}
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-100">
                            <Image
                              src={item.image}
                              alt={item.productName}
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className={cn(
                                    'w-2.5 h-2.5 rounded-sm border flex-shrink-0',
                                    item.isVeg ? 'border-veg' : 'border-nonveg'
                                  )}>
                                    <span className={cn(
                                      'block w-1 h-1 rounded-full mx-auto mt-[1.5px]',
                                      item.isVeg ? 'bg-veg' : 'bg-nonveg'
                                    )} />
                                  </span>
                                  <h4 className="text-sm font-semibold text-forest truncate">{item.productName}</h4>
                                </div>
                                <p className="text-[11px] text-neutral-500">{item.variantName}</p>
                              </div>
                              <button
                                onClick={() => removeItem(item.productId, item.variantId)}
                                className="p-1 rounded hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-colors flex-shrink-0"
                                aria-label={`Remove ${item.productName} from cart`}
                              >
                                <TrashIcon className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Price & Quantity */}
                            <div className="flex items-center justify-between mt-2">
                              <span className="price text-sm">{formatPrice(item.price * item.quantity)}</span>
                              <div className="flex items-center gap-0.5 bg-cream-dark rounded-lg">
                                <button
                                  onClick={() =>
                                    item.quantity <= 1
                                      ? removeItem(item.productId, item.variantId)
                                      : updateQuantity(item.productId, item.variantId, item.quantity - 1)
                                  }
                                  className="w-7 h-7 flex items-center justify-center text-forest hover:bg-neutral-200 rounded-l-lg transition-colors"
                                  aria-label="Decrease quantity"
                                >
                                  <MinusIcon className="w-3 h-3" />
                                </button>
                                <span className="w-7 h-7 flex items-center justify-center text-forest text-xs font-bold">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                                  className="w-7 h-7 flex items-center justify-center text-forest hover:bg-neutral-200 rounded-r-lg transition-colors"
                                  aria-label="Increase quantity"
                                >
                                  <PlusIcon className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Clear Cart */}
                  <button
                    onClick={clearCart}
                    className="w-full text-center text-xs text-neutral-400 hover:text-red-500 font-medium py-2 transition-colors"
                  >
                    Clear entire cart
                  </button>
                </div>

                {/* Order Summary & Checkout */}
                <div className="border-t border-neutral-200 bg-white p-4 space-y-3">
                  {/* Summary Lines */}
                  <div className="space-y-1.5 text-sm">
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

                  {/* Free delivery message */}
                  {deliveryFee > 0 && (
                    <p className="text-[11px] text-gold-dark bg-gold/5 px-3 py-2 rounded-lg text-center">
                      Add {formatPrice(DELIVERY_DEFAULTS.freeThreshold - subtotal)} more for free delivery!
                    </p>
                  )}

                  {/* Total */}
                  <div className="flex justify-between items-center pt-2 border-t border-neutral-100">
                    <span className="text-base font-semibold text-forest">Total</span>
                    <span className="price text-xl">{formatPrice(total)}</span>
                  </div>

                  {/* Checkout Button */}
                  <Link href="/checkout" onClick={onClose}>
                    <Button
                      fullWidth
                      size="lg"
                      variant="gold"
                      icon={<ArrowRightIcon className="w-5 h-5" />}
                      iconPosition="right"
                    >
                      Proceed to Checkout
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
