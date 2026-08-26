'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { NAV_LINKS, BRAND } from '@/lib/constants';
import { useCart } from '@/contexts/CartContext';
import Button from '@/components/ui/Button';
import CartDrawer from '@/components/cart/CartDrawer';

/* ── Icons (inline SVGs for zero-dep) ── */
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function CartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const pathname = usePathname();
  const { itemCount } = useCart();

  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Prevent scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* ═══ Desktop Navbar ═══ */}
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-[1020] transition-all duration-300',
          scrolled
            ? 'bg-cream/95 backdrop-blur-md shadow-soft py-2'
            : 'bg-transparent py-4'
        )}
      >
        <nav className="container-main flex items-center justify-between" aria-label="Main navigation">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0" aria-label="KSN AAHAAR - Home">
            <div className={cn(
              'font-heading font-bold tracking-tight transition-all duration-300',
              scrolled ? 'text-xl' : 'text-2xl',
              'text-forest'
            )}>
              <span className="text-forest">KSN</span>{' '}
              <span className="text-maroon">AAHAAR</span>
            </div>
          </Link>

          {/* Desktop Links */}
          <div className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200',
                  isActive(link.href)
                    ? 'text-forest bg-forest/5'
                    : 'text-neutral-600 hover:text-forest hover:bg-forest/5'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-2">
            <Link
              href="/menu"
              className="p-2.5 text-neutral-600 hover:text-forest hover:bg-forest/5 rounded-lg transition-colors"
              aria-label="Search"
            >
              <SearchIcon className="w-5 h-5" />
            </Link>

            <button
              onClick={openCart}
              className="relative p-2.5 text-neutral-600 hover:text-forest hover:bg-forest/5 rounded-lg transition-colors"
              aria-label={`Cart${itemCount > 0 ? ` (${itemCount} items)` : ''}`}
            >
              <CartIcon className="w-5 h-5" />
              {itemCount > 0 && (
                <motion.span
                  key={itemCount}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-maroon text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                >
                  {itemCount > 9 ? '9+' : itemCount}
                </motion.span>
              )}
            </button>

            <Link
              href="/account"
              className="p-2.5 text-neutral-600 hover:text-forest hover:bg-forest/5 rounded-lg transition-colors"
              aria-label="Account"
            >
              <UserIcon className="w-5 h-5" />
            </Link>

            <Link href="/menu" className="ml-2">
              <Button size="md">Order Now</Button>
            </Link>
          </div>

          {/* Mobile: Cart + Hamburger */}
          <div className="flex lg:hidden items-center gap-1">
            <Link
              href="/cart"
              className="relative p-2.5 text-neutral-600 hover:text-forest rounded-lg"
              aria-label={`Cart${itemCount > 0 ? ` (${itemCount} items)` : ''}`}
            >
              <CartIcon className="w-5 h-5" />
              {itemCount > 0 && (
                <motion.span
                  key={itemCount}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-maroon text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                >
                  {itemCount > 9 ? '9+' : itemCount}
                </motion.span>
              )}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2.5 text-neutral-600 hover:text-forest rounded-lg"
              aria-label="Open menu"
              aria-expanded={mobileMenuOpen}
            >
              <MenuIcon className="w-6 h-6" />
            </button>
          </div>
        </nav>
      </header>

      {/* ═══ Mobile Menu Overlay ═══ */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 z-[1040] lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-[80%] max-w-sm bg-cream z-[1050] lg:hidden overflow-y-auto"
              role="dialog"
              aria-label="Mobile navigation menu"
            >
              <div className="p-6">
                {/* Close Button */}
                <div className="flex justify-between items-center mb-8">
                  <div className="font-heading font-bold text-xl">
                    <span className="text-forest">KSN</span>{' '}
                    <span className="text-maroon">AAHAAR</span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 text-neutral-600 hover:text-forest rounded-lg"
                    aria-label="Close menu"
                  >
                    <CloseIcon className="w-6 h-6" />
                  </button>
                </div>

                {/* Mobile Links */}
                <div className="space-y-1">
                  {NAV_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        'flex items-center px-4 py-3 text-base font-medium rounded-lg transition-colors',
                        isActive(link.href)
                          ? 'text-forest bg-forest/5'
                          : 'text-neutral-600 hover:text-forest hover:bg-forest/5'
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>

                <div className="gold-line my-6" />

                {/* Mobile Account Links */}
                <div className="space-y-1">
                  <Link
                    href="/account"
                    className="flex items-center gap-3 px-4 py-3 text-base font-medium text-neutral-600 hover:text-forest hover:bg-forest/5 rounded-lg"
                  >
                    <UserIcon className="w-5 h-5" />
                    My Account
                  </Link>
                  <Link
                    href="/account/orders"
                    className="flex items-center gap-3 px-4 py-3 text-base font-medium text-neutral-600 hover:text-forest hover:bg-forest/5 rounded-lg"
                  >
                    My Orders
                  </Link>
                </div>

                <div className="mt-8">
                  <Link href="/menu" className="block">
                    <Button size="lg" fullWidth>
                      Order Now
                    </Button>
                  </Link>
                </div>

                {/* Contact */}
                <div className="mt-8 p-4 bg-cream-dark rounded-lg">
                  <p className="text-xs text-neutral-500 uppercase tracking-wider font-medium mb-2">Contact</p>
                  <p className="text-sm text-neutral-700">{BRAND.phone}</p>
                  <p className="text-sm text-neutral-700">{BRAND.email}</p>
                  <p className="text-xs text-neutral-500 mt-2">{BRAND.location}</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══ Mobile Bottom Navigation ═══ */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-[1020] bg-white/95 backdrop-blur-md border-t border-neutral-200 lg:hidden safe-area-bottom"
        aria-label="Mobile navigation"
      >
        <div className="grid grid-cols-4 h-16">
          <Link
            href="/"
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors',
              isActive('/') && pathname === '/' ? 'text-forest' : 'text-neutral-500'
            )}
            aria-label="Home"
          >
            <HomeIcon className="w-5 h-5" />
            <span>Home</span>
          </Link>
          <Link
            href="/menu"
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors',
              isActive('/menu') ? 'text-forest' : 'text-neutral-500'
            )}
            aria-label="Menu"
          >
            <GridIcon className="w-5 h-5" />
            <span>Menu</span>
          </Link>
          <Link
            href="/cart"
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors relative',
              isActive('/cart') ? 'text-forest' : 'text-neutral-500'
            )}
            aria-label={`Cart${itemCount > 0 ? ` (${itemCount} items)` : ''}`}
          >
            <div className="relative">
              <CartIcon className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 w-4 h-4 bg-maroon text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </div>
            <span>Cart</span>
          </Link>
          <Link
            href="/account"
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors',
              isActive('/account') ? 'text-forest' : 'text-neutral-500'
            )}
            aria-label="Account"
          >
            <UserIcon className="w-5 h-5" />
            <span>Account</span>
          </Link>
        </div>
      </nav>

      {/* Spacer for fixed navbar */}
      <div className="h-16 lg:h-20" aria-hidden="true" />

      {/* Cart Drawer */}
      <CartDrawer isOpen={cartOpen} onClose={closeCart} />
    </>
  );
}
