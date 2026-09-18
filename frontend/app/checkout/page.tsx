'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice, cn } from '@/lib/utils';
import { DELIVERY_DEFAULTS, BRAND } from '@/lib/constants';
import { createOrder, createPaymentOrder, verifyPayment, validateCoupon } from '@/lib/api';
import Button from '@/components/ui/Button';

/* ── Razorpay type declaration ── */
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: { name: string; email?: string; contact: string };
  theme: { color: string };
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: () => void) => void;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

/* ── Icons ── */
function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
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

function TruckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" /><path d="M15 18H9" /><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" /><circle cx="17" cy="18" r="2" /><circle cx="7" cy="18" r="2" />
    </svg>
  );
}

function StoreIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" /><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" /><path d="M2 7h20" /><path d="M22 7v3a2 2 0 0 1-2 2 2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

/* ── Steps ── */
type CheckoutStep = 'details' | 'address' | 'review';

const STEPS: { id: CheckoutStep; label: string; number: number }[] = [
  { id: 'details', label: 'Details', number: 1 },
  { id: 'address', label: 'Address', number: 2 },
  { id: 'review', label: 'Review', number: 3 },
];

/* ── Form State Type ── */
interface CheckoutFormState {
  orderType: 'delivery' | 'pickup';
  name: string;
  phone: string;
  email: string;
  houseFlat: string;
  street: string;
  area: string;
  city: string;
  pincode: string;
  instructions: string;
  notes: string;
}

const initialForm: CheckoutFormState = {
  orderType: 'delivery',
  name: '',
  phone: '',
  email: '',
  houseFlat: '',
  street: '',
  area: '',
  city: 'Hyderabad',
  pincode: '',
  instructions: '',
  notes: '',
};

/* ── Load Razorpay script ── */
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, deliveryFee, discount, total, itemCount, clearCart, couponCode, applyCoupon, removeCoupon } = useCart();
  const { user, token, isAuthenticated } = useAuth();
  const [step, setStep] = useState<CheckoutStep>('details');
  const [form, setForm] = useState<CheckoutFormState>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutFormState, string>>>({});
  const [isPlacing, setIsPlacing] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  // Pre-fill from auth if logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      setForm((prev) => ({
        ...prev,
        name: prev.name || user.name || '',
        phone: prev.phone || user.phone || '',
        email: prev.email || user.email || '',
      }));
    }
  }, [isAuthenticated, user]);

  const updateField = (field: keyof CheckoutFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    setOrderError(null);
  };

  const validateDetails = (): boolean => {
    const newErrors: Partial<Record<keyof CheckoutFormState, string>> = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\s/g, ''))) newErrors.phone = 'Enter a valid 10-digit phone number';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Enter a valid email';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateAddress = (): boolean => {
    if (form.orderType === 'pickup') return true;

    const newErrors: Partial<Record<keyof CheckoutFormState, string>> = {};
    if (!form.houseFlat.trim()) newErrors.houseFlat = 'House/Flat number is required';
    if (!form.street.trim()) newErrors.street = 'Street/Lane is required';
    if (!form.area.trim()) newErrors.area = 'Area/Locality is required';
    if (!form.pincode.trim()) newErrors.pincode = 'Pincode is required';
    else if (!/^\d{6}$/.test(form.pincode)) newErrors.pincode = 'Enter a valid 6-digit pincode';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 'details' && validateDetails()) {
      setStep(form.orderType === 'pickup' ? 'review' : 'address');
    } else if (step === 'address' && validateAddress()) {
      setStep('review');
    }
  };

  const handleBack = () => {
    if (step === 'address') setStep('details');
    else if (step === 'review') setStep(form.orderType === 'pickup' ? 'details' : 'address');
  };

  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) { setCouponError('Please enter a coupon code'); return; }
    setCouponLoading(true);
    setCouponError('');
    setCouponSuccess('');
    try {
      const result = await validateCoupon(code, subtotal);
      if (result.success && result.data) {
        applyCoupon(result.data.code, result.data.discountAmount);
        setCouponSuccess(`"${result.data.code}" applied! You save ${formatPrice(result.data.discountAmount)}`);
        setCouponError('');
      } else {
        setCouponError(result.error || 'Invalid coupon');
      }
    } catch {
      setCouponError('Could not validate coupon. Try again.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponInput('');
    setCouponSuccess('');
    setCouponError('');
  };
  const handlePlaceOrder = async () => {
    setIsPlacing(true);
    setOrderError(null);

    try {
      // Step 1: Create order on backend
      const orderPayload = {
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          productName: item.productName,
          variantName: item.variantName,
          unitPrice: item.price,
          quantity: item.quantity,
          image: item.image,
          isVeg: item.isVeg,
        })),
        orderType: form.orderType,
        deliveryAddress: form.orderType === 'delivery' ? {
          houseFlat: form.houseFlat,
          street: form.street,
          area: form.area,
          city: form.city,
          state: 'Telangana',
          pincode: form.pincode,
          instructions: form.instructions || undefined,
        } : undefined,
        customerName: form.name,
        customerPhone: form.phone.replace(/\s/g, ''),
        customerEmail: form.email || undefined,
        couponCode: couponCode || undefined,
        notes: form.notes || undefined,
      };

      const orderResult = await createOrder(orderPayload, token);

      if (!orderResult.success || !orderResult.data) {
        // Handle price changes — 422 with structured data
        if (orderResult.priceChanges && orderResult.priceChanges.length > 0) {
          const changes = orderResult.priceChanges
            .map(c => `• ${c.productName} (${c.variantName}): ₹${c.oldPrice} → ₹${c.newPrice}`)
            .join('\n');
          throw new Error(
            `Prices have changed since you added items to your cart:\n${changes}\n\nPlease refresh your cart to see updated prices.`
          );
        }
        // Handle unavailable items — 422 with unavailableItems
        if (orderResult.unavailableItems && orderResult.unavailableItems.length > 0) {
          throw new Error(
            `Some items are no longer available:\n${orderResult.unavailableItems.map(i => `• ${i}`).join('\n')}\n\nPlease remove them from your cart and try again.`
          );
        }
        throw new Error(orderResult.error || 'Failed to create order');
      }

      const { orderId } = orderResult.data;

      // Step 2: Create Razorpay payment order
      const paymentResult = await createPaymentOrder(orderId);

      if (!paymentResult.success || !paymentResult.data) {
        // If Razorpay is not configured, redirect to confirmation with COD-style flow
        clearCart();
        router.push(`/order/confirmation?orderId=${orderId}`);
        return;
      }

      // Step 3: Open Razorpay checkout
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load payment gateway. Please try again.');
      }

      const { razorpayOrderId, amount, currency, key } = paymentResult.data;

      const razorpayOptions: RazorpayOptions = {
        key,
        amount,
        currency,
        name: BRAND.name,
        description: `Order ${orderId}`,
        order_id: razorpayOrderId,
        handler: async (response: RazorpayResponse) => {
          // Step 4: Verify payment
          try {
            const verifyResult = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyResult.success) {
              clearCart();
              router.push(`/order/confirmation?orderId=${orderId}`);
            } else {
              setOrderError('Payment verification failed. Please contact support.');
              setIsPlacing(false);
            }
          } catch {
            setOrderError('Payment verification failed. Please contact support.');
            setIsPlacing(false);
          }
        },
        prefill: {
          name: form.name,
          email: form.email || undefined,
          contact: `+91${form.phone.replace(/\s/g, '')}`,
        },
        theme: { color: '#173D18' },
        modal: {
          ondismiss: () => {
            setIsPlacing(false);
            setOrderError('Payment was cancelled. Your order has been saved. You can retry payment.');
          },
        },
      };

      const razorpay = new window.Razorpay(razorpayOptions);
      razorpay.on('payment.failed', () => {
        setIsPlacing(false);
        setOrderError('Payment failed. Please try again or use a different payment method.');
      });
      razorpay.open();
    } catch (err) {
      setIsPlacing(false);
      setOrderError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  if (items.length === 0) {
    return (
      <section className="py-16 lg:py-24">
        <div className="container-main text-center max-w-md mx-auto">
          <h1 className="font-heading font-bold text-2xl text-forest mb-3">No Items to Checkout</h1>
          <p className="text-body mb-8">Your cart is empty. Add some items before checking out.</p>
          <Link href="/menu">
            <Button size="lg">Browse Menu</Button>
          </Link>
        </div>
      </section>
    );
  }

  const currentStepIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <>
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="container-main py-4">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={handleBack} className="p-2 -ml-2 rounded-lg hover:bg-cream-dark transition-colors" aria-label="Go back">
              <ArrowLeftIcon className="w-5 h-5 text-neutral-600" />
            </button>
            <h1 className="font-heading font-semibold text-xl text-forest">Checkout</h1>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => {
              const isCompleted = i < currentStepIndex;
              const isCurrent = s.id === step;
              const isSkipped = s.id === 'address' && form.orderType === 'pickup';

              if (isSkipped) return null;

              return (
                <div key={s.id} className="flex items-center gap-2 flex-1">
                  <div className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors flex-shrink-0',
                    isCompleted ? 'bg-veg text-white' :
                    isCurrent ? 'bg-forest text-white' :
                    'bg-neutral-200 text-neutral-500'
                  )}>
                    {isCompleted ? <CheckIcon className="w-4 h-4" /> : s.number}
                  </div>
                  <span className={cn(
                    'text-xs font-medium hidden sm:inline',
                    isCurrent ? 'text-forest' : 'text-neutral-500'
                  )}>
                    {s.label}
                  </span>
                  {i < STEPS.filter((ss) => !(ss.id === 'address' && form.orderType === 'pickup')).length - 1 && (
                    <div className={cn(
                      'flex-1 h-0.5 rounded',
                      isCompleted ? 'bg-veg' : 'bg-neutral-200'
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <section className="py-6 pb-40 lg:pb-6">
        <div className="container-main">
          {/* Order Error */}
          {orderError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl"
            >
              <p className="text-sm text-red-700 whitespace-pre-line">{orderError}</p>
              <button
                onClick={() => setOrderError(null)}
                className="text-xs text-red-500 underline mt-1"
              >
                Dismiss
              </button>
            </motion.div>
          )}

          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Form Area */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                {step === 'details' && (
                  <motion.div
                    key="details"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                  >
                    {/* Order Type */}
                    <div className="bg-white rounded-xl p-5 shadow-soft mb-4">
                      <h2 className="font-heading font-semibold text-base text-forest mb-4">Order Type</h2>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => updateField('orderType', 'delivery')}
                          className={cn(
                            'p-4 rounded-xl border-2 text-center transition-all',
                            form.orderType === 'delivery'
                              ? 'border-forest bg-forest/5'
                              : 'border-neutral-200 hover:border-forest/30'
                          )}
                        >
                          <TruckIcon className={cn('w-8 h-8 mx-auto mb-2', form.orderType === 'delivery' ? 'text-forest' : 'text-neutral-400')} />
                          <p className={cn('font-semibold text-sm', form.orderType === 'delivery' ? 'text-forest' : 'text-neutral-600')}>Delivery</p>
                          <p className="text-[11px] text-neutral-500 mt-0.5">{DELIVERY_DEFAULTS.estimatedTime}</p>
                        </button>
                        <button
                          onClick={() => updateField('orderType', 'pickup')}
                          className={cn(
                            'p-4 rounded-xl border-2 text-center transition-all',
                            form.orderType === 'pickup'
                              ? 'border-forest bg-forest/5'
                              : 'border-neutral-200 hover:border-forest/30'
                          )}
                        >
                          <StoreIcon className={cn('w-8 h-8 mx-auto mb-2', form.orderType === 'pickup' ? 'text-forest' : 'text-neutral-400')} />
                          <p className={cn('font-semibold text-sm', form.orderType === 'pickup' ? 'text-forest' : 'text-neutral-600')}>Pickup</p>
                          <p className="text-[11px] text-neutral-500 mt-0.5">Save on delivery</p>
                        </button>
                      </div>
                    </div>

                    {/* Customer Details */}
                    <div className="bg-white rounded-xl p-5 shadow-soft">
                      <h2 className="font-heading font-semibold text-base text-forest mb-4">Your Details</h2>
                      <div className="space-y-4">
                        <InputField
                          label="Full Name *"
                          value={form.name}
                          onChange={(v) => updateField('name', v)}
                          error={errors.name}
                          placeholder="e.g. Ramesh Kumar"
                          autoComplete="name"
                        />
                        <InputField
                          label="Phone Number *"
                          value={form.phone}
                          onChange={(v) => updateField('phone', v)}
                          error={errors.phone}
                          placeholder="e.g. 9876543210"
                          type="tel"
                          autoComplete="tel"
                          prefix="+91"
                        />
                        <InputField
                          label="Email (Optional)"
                          value={form.email}
                          onChange={(v) => updateField('email', v)}
                          error={errors.email}
                          placeholder="e.g. ramesh@email.com"
                          type="email"
                          autoComplete="email"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 'address' && (
                  <motion.div
                    key="address"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="bg-white rounded-xl p-5 shadow-soft">
                      <h2 className="font-heading font-semibold text-base text-forest mb-4">Delivery Address</h2>
                      <div className="space-y-4">
                        <InputField
                          label="House / Flat / Building *"
                          value={form.houseFlat}
                          onChange={(v) => updateField('houseFlat', v)}
                          error={errors.houseFlat}
                          placeholder="e.g. Flat 302, Block A, Sai Residency"
                          autoComplete="address-line1"
                        />
                        <InputField
                          label="Street / Lane *"
                          value={form.street}
                          onChange={(v) => updateField('street', v)}
                          error={errors.street}
                          placeholder="e.g. Miyapur Main Road"
                          autoComplete="address-line2"
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <InputField
                            label="Area / Locality *"
                            value={form.area}
                            onChange={(v) => updateField('area', v)}
                            error={errors.area}
                            placeholder="e.g. Miyapur"
                          />
                          <InputField
                            label="Pincode *"
                            value={form.pincode}
                            onChange={(v) => updateField('pincode', v)}
                            error={errors.pincode}
                            placeholder="e.g. 500049"
                            autoComplete="postal-code"
                          />
                        </div>
                        <InputField
                          label="Delivery Instructions (Optional)"
                          value={form.instructions}
                          onChange={(v) => updateField('instructions', v)}
                          placeholder="e.g. Ring the doorbell, leave at door"
                          isTextarea
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 'review' && (
                  <motion.div
                    key="review"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-4"
                  >
                    {/* Order Items */}
                    <div className="bg-white rounded-xl p-5 shadow-soft">
                      <h2 className="font-heading font-semibold text-base text-forest mb-4">Order Items</h2>
                      <div className="space-y-3">
                        {items.map((item) => (
                          <div key={`${item.productId}-${item.variantId}`} className="flex items-center gap-3">
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-100 flex items-center justify-center">
                              {item.image ? (
                                <Image src={item.image} alt={item.productName} fill sizes="48px" className="object-cover" />
                              ) : (
                                <span className="text-2xl">🍛</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-forest truncate">{item.productName}</p>
                              <p className="text-xs text-neutral-500">{item.variantName} × {item.quantity}</p>
                            </div>
                            <span className="text-sm font-semibold text-forest">{formatPrice(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Customer Info Summary */}
                    <div className="bg-white rounded-xl p-5 shadow-soft">
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="font-heading font-semibold text-base text-forest">
                          {form.orderType === 'delivery' ? 'Delivery Details' : 'Pickup Details'}
                        </h2>
                        <button onClick={() => setStep('details')} className="text-xs text-gold-dark font-medium hover:text-gold transition-colors">
                          Edit
                        </button>
                      </div>
                      <div className="text-sm text-neutral-600 space-y-1">
                        <p><strong className="text-forest">{form.name}</strong></p>
                        <p>+91 {form.phone}</p>
                        {form.email && <p>{form.email}</p>}
                        {form.orderType === 'delivery' && (
                          <p className="pt-2 text-neutral-500">
                            {form.houseFlat}, {form.street}, {form.area}, {form.city} - {form.pincode}
                          </p>
                        )}
                        {form.orderType === 'pickup' && (
                          <p className="pt-2 text-neutral-500">{BRAND.location}</p>
                        )}
                        {form.instructions && (
                          <p className="pt-1 text-xs italic text-neutral-400">Note: {form.instructions}</p>
                        )}
                      </div>
                    </div>

                    {/* Order Notes */}
                    <div className="bg-white rounded-xl p-5 shadow-soft">
                      <h2 className="font-heading font-semibold text-base text-forest mb-3">Order Notes (Optional)</h2>
                      <textarea
                        value={form.notes}
                        onChange={(e) => updateField('notes', e.target.value)}
                        placeholder="Any special requests for the kitchen?"
                        rows={2}
                        className="w-full px-4 py-3 text-sm bg-cream border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors resize-none"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-6">
                {step !== 'details' ? (
                  <Button variant="outline" onClick={handleBack}>
                    Back
                  </Button>
                ) : (
                  <div />
                )}
                {step !== 'review' ? (
                  <Button onClick={handleNext}>
                    Continue
                  </Button>
                ) : null}
              </div>

              {/* Mobile Coupon Input — only shown below lg breakpoint */}
              <div className="mt-4 lg:hidden">
                <div className="bg-white rounded-xl p-4 shadow-soft">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">Have a coupon?</p>
                  {couponCode ? (
                    <div className="flex items-center justify-between bg-veg/10 rounded-lg px-3 py-2">
                      <div>
                        <span className="text-xs font-bold text-veg">🎉 {couponCode}</span>
                        <p className="text-[10px] text-neutral-500 mt-0.5">{couponSuccess}</p>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        className="text-xs text-red-500 hover:text-red-600 font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                          placeholder="Enter coupon code"
                          className="flex-1 px-3 py-2 text-xs bg-cream border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors uppercase"
                        />
                        <button
                          onClick={handleApplyCoupon}
                          disabled={couponLoading}
                          className="px-3 py-2 text-xs font-semibold bg-forest text-white rounded-lg hover:bg-forest-dark disabled:opacity-50 transition-colors whitespace-nowrap"
                        >
                          {couponLoading ? '...' : 'Apply'}
                        </button>
                      </div>
                      {couponError && <p className="text-[11px] text-red-500 mt-1.5">{couponError}</p>}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1 hidden lg:block">
              <div className="bg-white rounded-xl p-5 shadow-soft sticky top-24">
                <h2 className="font-heading font-semibold text-lg text-forest mb-4">Order Summary</h2>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between text-neutral-600">
                    <span>Items ({itemCount})</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Delivery</span>
                    <span className={cn('font-medium', deliveryFee === 0 && 'text-veg')}>
                      {form.orderType === 'pickup' ? 'N/A' : deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}
                    </span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-veg">
                      <span>Discount</span>
                      <span className="font-medium">-{formatPrice(discount)}</span>
                    </div>
                  )}
                </div>

                {/* Coupon Input */}
                <div className="mb-4 pb-4 border-b border-neutral-100">
                  {couponCode ? (
                    <div className="flex items-center justify-between bg-veg/10 rounded-lg px-3 py-2">
                      <div>
                        <span className="text-xs font-bold text-veg">🎉 {couponCode}</span>
                        <p className="text-[10px] text-neutral-500 mt-0.5">{couponSuccess}</p>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        className="text-xs text-red-500 hover:text-red-600 font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                          placeholder="Coupon code"
                          className="flex-1 px-3 py-2 text-xs bg-cream border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors uppercase"
                        />
                        <button
                          onClick={handleApplyCoupon}
                          disabled={couponLoading}
                          className="px-3 py-2 text-xs font-semibold bg-forest text-white rounded-lg hover:bg-forest-dark disabled:opacity-50 transition-colors whitespace-nowrap"
                        >
                          {couponLoading ? '...' : 'Apply'}
                        </button>
                      </div>
                      {couponError && <p className="text-[11px] text-red-500 mt-1.5">{couponError}</p>}
                      <p className="text-[10px] text-neutral-400 mt-1.5">Try: WELCOME10, KSN50</p>
                    </>
                  )}
                </div>

                <div className="flex justify-between items-center pt-3">
                  <span className="font-semibold text-forest">Total</span>
                  <span className="price text-xl">{formatPrice(total)}</span>
                </div>

                {step === 'review' && (
                  <div className="mt-4">
                    <Button
                      fullWidth
                      size="lg"
                      variant="gold"
                      onClick={handlePlaceOrder}
                      isLoading={isPlacing}
                      icon={!isPlacing ? <LockIcon className="w-4 h-4" /> : undefined}
                    >
                      {isPlacing ? 'Processing...' : `Place Order · ${formatPrice(total)}`}
                    </Button>
                    <p className="text-[10px] text-neutral-400 text-center mt-2 flex items-center justify-center gap-1">
                      <LockIcon className="w-3 h-3" /> Secure Checkout
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Fixed Bottom CTA */}
      <div className="fixed bottom-16 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-neutral-200 p-4 lg:hidden">
        {step === 'review' ? (
          <Button
            fullWidth
            size="lg"
            variant="gold"
            onClick={handlePlaceOrder}
            isLoading={isPlacing}
            icon={!isPlacing ? <LockIcon className="w-4 h-4" /> : undefined}
          >
            {isPlacing ? 'Processing...' : `Place Order · ${formatPrice(total)}`}
          </Button>
        ) : (
          <Button fullWidth size="lg" onClick={handleNext}>
            Continue
          </Button>
        )}
      </div>
    </>
  );
}

/* ── Reusable Input Field ── */
function InputField({
  label,
  value,
  onChange,
  error,
  placeholder,
  type = 'text',
  autoComplete,
  prefix,
  isTextarea = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
  prefix?: string;
  isTextarea?: boolean;
}) {
  const inputClass = cn(
    'w-full px-4 py-3 text-sm bg-cream border rounded-lg transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold',
    error ? 'border-red-300 bg-red-50/30' : 'border-neutral-200',
    prefix && 'pl-12'
  );

  return (
    <div>
      <label className="block text-xs font-medium text-neutral-600 mb-1.5">{label}</label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-neutral-400 font-medium">
            {prefix}
          </span>
        )}
        {isTextarea ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={2}
            className={cn(inputClass, 'resize-none')}
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            autoComplete={autoComplete}
            className={inputClass}
          />
        )}
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
