'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getActiveCoupons, type PublicCoupon } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { BRAND } from '@/lib/constants';
import Button from '@/components/ui/Button';

function TagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.41 0l7.3-7.3a1 1 0 0 0 0-1.41L12 2z" />
      <path d="M7 7h.01" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function CouponCard({ coupon }: { coupon: PublicCoupon }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(coupon.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const discountLabel = coupon.discountType === 'percentage'
    ? `${coupon.discountValue}% OFF`
    : `₹${coupon.discountValue} OFF`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-soft overflow-hidden"
    >
      {/* Top band with discount */}
      <div className="bg-gradient-to-r from-forest to-forest-dark p-5 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-32 opacity-10">
          <TagIcon className="w-full h-full" />
        </div>
        <p className="text-gold text-xs uppercase tracking-[0.2em] font-semibold mb-1">Special Offer</p>
        <h3 className="font-heading font-bold text-3xl text-white">{discountLabel}</h3>
        {coupon.description && (
          <p className="text-white/70 text-sm mt-1">{coupon.description}</p>
        )}
      </div>

      {/* Coupon Code + Details */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold mb-1">Coupon Code</p>
            <p className="font-mono text-xl font-bold text-forest tracking-widest">{coupon.code}</p>
          </div>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
              copied
                ? 'bg-veg/15 text-veg border border-veg/30'
                : 'bg-forest/5 text-forest border border-forest/20 hover:bg-forest/10'
            }`}
            aria-label="Copy coupon code"
          >
            {copied ? <CheckIcon className="w-3.5 h-3.5" /> : <CopyIcon className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <div className="space-y-1.5 text-xs text-neutral-500">
          <div className="flex justify-between">
            <span>Min. Order</span>
            <span className="font-medium text-neutral-700">{formatPrice(coupon.minOrderAmount)}</span>
          </div>
          {coupon.maxDiscount && coupon.discountType === 'percentage' && (
            <div className="flex justify-between">
              <span>Max. Discount</span>
              <span className="font-medium text-neutral-700">{formatPrice(coupon.maxDiscount)}</span>
            </div>
          )}
        </div>

        <Link href="/checkout" className="block mt-4">
          <Button size="sm" fullWidth variant="primary">
            Use This Coupon →
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}

export default function OffersPage() {
  const [coupons, setCoupons] = useState<PublicCoupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActiveCoupons().then(res => {
      if (res.success && res.data) setCoupons(res.data);
      setLoading(false);
    });
  }, []);

  return (
    <>
      {/* Header */}
      <section className="bg-forest relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-40 h-40 bg-gold rounded-full blur-3xl" />
          <div className="absolute bottom-5 right-20 w-60 h-60 bg-gold rounded-full blur-3xl" />
        </div>
        <div className="container-main py-10 lg:py-14 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <p className="text-gold text-xs uppercase tracking-[0.2em] font-medium mb-3">{BRAND.name}</p>
            <h1 className="font-heading font-bold text-3xl lg:text-5xl text-white mb-3">
              Today&apos;s <span className="text-gold">Offers</span>
            </h1>
            <p className="text-white/60 max-w-lg mx-auto text-sm lg:text-base">
              Exclusive discounts and coupon codes — apply them at checkout for instant savings.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-10 lg:py-14">
        <div className="container-main max-w-4xl">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-forest/20 border-t-forest rounded-full animate-spin" />
            </div>
          ) : coupons.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-neutral-100 flex items-center justify-center text-5xl">
                🏷️
              </div>
              <h2 className="font-heading font-semibold text-2xl text-forest mb-3">
                No Offers Right Now
              </h2>
              <p className="text-neutral-500 max-w-sm mx-auto mb-6">
                We don&apos;t have any active offers at the moment. Check back soon — we post new deals regularly!
              </p>
              <p className="text-sm text-neutral-400 mb-8">
                Follow us on WhatsApp at <strong className="text-forest">{BRAND.whatsapp}</strong> to get notified about new offers.
              </p>
              <Link href="/menu">
                <Button icon={<span>🍛</span>} iconPosition="left">
                  Browse Menu Anyway
                </Button>
              </Link>
            </motion.div>
          ) : (
            <>
              <p className="text-sm text-neutral-500 mb-6 text-center">
                {coupons.length} active offer{coupons.length !== 1 ? 's' : ''} available
              </p>
              <div className="grid sm:grid-cols-2 gap-5">
                {coupons.map(coupon => (
                  <CouponCard key={coupon._id} coupon={coupon} />
                ))}
              </div>

              {/* How to use */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-10 bg-white rounded-2xl shadow-soft p-6"
              >
                <h3 className="font-heading font-semibold text-lg text-forest mb-4">How to use a coupon?</h3>
                <ol className="space-y-3">
                  {['Add items to your cart from the menu.', 'Go to Checkout.', 'Enter the coupon code in the "Have a coupon?" field.', 'The discount will be applied automatically to your order!'].map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-forest text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <p className="text-sm text-neutral-600">{step}</p>
                    </li>
                  ))}
                </ol>
              </motion.div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
