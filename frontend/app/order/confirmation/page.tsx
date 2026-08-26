'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Suspense } from 'react';
import { useCart } from '@/contexts/CartContext';
import Button from '@/components/ui/Button';

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || 'KSN-XXXXX';
  const { clearCart } = useCart();
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    if (!cleared) {
      clearCart();
      setCleared(true);
    }
  }, [cleared, clearCart]);

  return (
    <section className="min-h-[calc(100vh-10rem)] flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const }}
        className="text-center max-w-md mx-auto"
      >
        {/* Success Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
          className="w-20 h-20 rounded-full bg-veg/10 flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircleIcon className="w-10 h-10 text-veg" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h1 className="font-heading font-bold text-2xl lg:text-3xl text-forest mb-2">
            Order Placed! 🎉
          </h1>
          <p className="text-body text-sm mb-2">
            Thank you for ordering from KSN AAHAAR.
          </p>
          <p className="text-xs text-neutral-500 mb-6">
            Your order <span className="font-semibold text-forest">{orderId}</span> has been placed successfully.
          </p>
        </motion.div>

        {/* Timeline Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl shadow-soft p-5 mb-6 text-left"
        >
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">What&apos;s Next</p>
          <div className="space-y-3">
            {[
              { emoji: '✅', text: 'Order confirmed & sent to kitchen', active: true },
              { emoji: '👨‍🍳', text: 'Our chef starts preparing your food', active: false },
              { emoji: '📦', text: 'Your order is packed and ready', active: false },
              { emoji: '🛵', text: 'Out for delivery to your doorstep', active: false },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-base">{step.emoji}</span>
                <span className={`text-sm ${step.active ? 'text-forest font-medium' : 'text-neutral-400'}`}>{step.text}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link href={`/order/${orderId}`}>
            <Button size="lg">Track My Order</Button>
          </Link>
          <Link href="/menu">
            <Button size="lg" variant="outline">Order More</Button>
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-xs text-neutral-400 mt-6"
        >
          You&apos;ll receive updates via SMS/WhatsApp on your registered number.
        </motion.p>
      </motion.div>
    </section>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-forest/30 border-t-forest rounded-full animate-spin" /></div>}>
      <OrderConfirmationContent />
    </Suspense>
  );
}
