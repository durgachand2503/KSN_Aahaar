'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';

/* ── Icons ── */
function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.13 11.7a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.08 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}
function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
    </svg>
  );
}
function LogOutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
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

export default function AccountPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login?redirect=/account');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="w-8 h-8 border-[3px] border-forest/20 border-t-forest rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <>
      {/* Header */}
      <section className="bg-forest relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 right-20 w-48 h-48 bg-gold rounded-full blur-3xl" />
        </div>
        <div className="container-main py-10 lg:py-12 relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="text-gold text-xs uppercase tracking-[0.2em] font-medium mb-2">My Account</p>
            <h1 className="font-heading font-bold text-3xl lg:text-4xl text-white">
              Welcome, <span className="text-gold">{user.name.split(' ')[0]}</span>
            </h1>
            <p className="text-white/60 mt-1 text-sm">Manage your profile and track your orders</p>
          </motion.div>
        </div>
      </section>

      <section className="py-8 lg:py-10">
        <div className="container-main">
          <div className="grid lg:grid-cols-3 gap-6">

            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-1"
            >
              <div className="bg-white rounded-2xl shadow-soft p-6">
                {/* Avatar */}
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-forest/10 flex items-center justify-center mb-3">
                    <span className="font-heading font-bold text-3xl text-forest">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <h2 className="font-heading font-semibold text-xl text-forest">{user.name}</h2>
                  <span className="mt-1 text-xs bg-gold/15 text-gold-dark font-semibold px-3 py-1 rounded-full uppercase tracking-wide">Customer</span>
                </div>

                {/* Details */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-cream rounded-xl">
                    <MailIcon className="w-4 h-4 text-forest flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-medium">Email</p>
                      <p className="text-sm text-neutral-700 truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-cream rounded-xl">
                    <PhoneIcon className="w-4 h-4 text-forest flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-medium">Phone</p>
                      <p className="text-sm text-neutral-700">{user.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-cream rounded-xl">
                    <UserIcon className="w-4 h-4 text-forest flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-medium">Member since</p>
                      <p className="text-sm text-neutral-700">
                        {user.createdAt ? new Date(user.createdAt).getFullYear() : new Date().getFullYear()}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 border border-red-200 transition-colors"
                >
                  <LogOutIcon className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </motion.div>

            {/* Quick Links + Orders */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2 space-y-5"
            >
              {/* Quick Actions */}
              <div className="bg-white rounded-2xl shadow-soft p-6">
                <h3 className="font-heading font-semibold text-lg text-forest mb-4">Quick Actions</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Link href="/account/orders" className="group flex items-center justify-between p-4 rounded-xl bg-cream hover:bg-forest/5 border border-neutral-100 hover:border-forest/20 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-forest/10 flex items-center justify-center">
                        <ClipboardIcon className="w-5 h-5 text-forest" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-forest">My Orders</p>
                        <p className="text-xs text-neutral-500">Track all your orders</p>
                      </div>
                    </div>
                    <ArrowRightIcon className="w-4 h-4 text-neutral-400 group-hover:text-forest transition-colors" />
                  </Link>
                  <Link href="/menu" className="group flex items-center justify-between p-4 rounded-xl bg-cream hover:bg-forest/5 border border-neutral-100 hover:border-forest/20 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                        <span className="text-gold text-lg">🍛</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-forest">Order Food</p>
                        <p className="text-xs text-neutral-500">Browse our full menu</p>
                      </div>
                    </div>
                    <ArrowRightIcon className="w-4 h-4 text-neutral-400 group-hover:text-forest transition-colors" />
                  </Link>
                  <Link href="/offers" className="group flex items-center justify-between p-4 rounded-xl bg-cream hover:bg-forest/5 border border-neutral-100 hover:border-forest/20 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-maroon/10 flex items-center justify-center">
                        <span className="text-maroon text-lg">🏷️</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-forest">Offers & Coupons</p>
                        <p className="text-xs text-neutral-500">See today&apos;s deals</p>
                      </div>
                    </div>
                    <ArrowRightIcon className="w-4 h-4 text-neutral-400 group-hover:text-forest transition-colors" />
                  </Link>
                  <Link href="/contact" className="group flex items-center justify-between p-4 rounded-xl bg-cream hover:bg-forest/5 border border-neutral-100 hover:border-forest/20 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-forest/10 flex items-center justify-center">
                        <MailIcon className="w-5 h-5 text-forest" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-forest">Contact Us</p>
                        <p className="text-xs text-neutral-500">Get support or feedback</p>
                      </div>
                    </div>
                    <ArrowRightIcon className="w-4 h-4 text-neutral-400 group-hover:text-forest transition-colors" />
                  </Link>
                </div>
              </div>

              {/* View all orders CTA */}
              <div className="bg-gradient-to-br from-forest to-forest-dark rounded-2xl p-6 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-heading font-bold text-xl mb-1">Your Order History</h3>
                    <p className="text-white/70 text-sm mb-4">View all past and current orders, track deliveries, and re-order your favourites.</p>
                    <Link href="/account/orders">
                      <Button variant="gold" size="md" icon={<ArrowRightIcon className="w-4 h-4" />} iconPosition="right">
                        View All Orders
                      </Button>
                    </Link>
                  </div>
                  <span className="text-6xl opacity-20">📦</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
