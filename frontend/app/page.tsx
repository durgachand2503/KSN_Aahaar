'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';
import ProductCard from '@/components/product/ProductCard';
import { PRODUCTS, CATEGORIES, BRAND } from '@/lib/constants';
import { formatPrice } from '@/lib/utils';

/* ── Animation variants ── */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

/* ── Icons ── */
function ChefHatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1" /><path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" /><path d="M6 21v-4" /><path d="M18 21v-4" /><path d="M20 7a4 4 0 0 0-4-4" /><path d="M4 7a4 4 0 0 1 4-4" />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" />
    </svg>
  );
}

function LeafIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 2 8 0 5.5-4.78 10-10 10Z" /><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );
}

function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" />
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

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

// ── Trust Items ──
const TRUST_ITEMS = [
  {
    icon: ChefHatIcon,
    title: 'Freshly Prepared',
    description: 'Prepared with care and served fresh to your doorstep.',
  },
  {
    icon: SparklesIcon,
    title: 'Authentic Recipes',
    description: 'Traditional flavours inspired by home cooking.',
  },
  {
    icon: LeafIcon,
    title: 'Quality Ingredients',
    description: 'Carefully selected, premium ingredients.',
  },
  {
    icon: TruckIcon,
    title: 'Delivered Fresh',
    description: 'Prepared and delivered with attention to quality.',
  },
];

export default function HomePage() {
  const featuredProducts = PRODUCTS.filter((p) => p.isFeatured).slice(0, 6);

  return (
    <>
      {/* ═══════════════════════════════════
          HERO SECTION
          ═══════════════════════════════════ */}
      <section className="relative overflow-hidden bg-cream" aria-labelledby="hero-heading">
        <div className="container-main">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[calc(100vh-5rem)] py-12 lg:py-0">
            {/* Text */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="text-center lg:text-left order-2 lg:order-1"
            >
              {/* Subtitle */}
              <motion.p
                variants={fadeUp}
                custom={0}
                className="text-caption text-gold-dark mb-4 flex items-center justify-center lg:justify-start gap-2"
              >
                <span className="w-8 h-px bg-gold" />
                Home Cloud Kitchen
                <span className="w-8 h-px bg-gold" />
              </motion.p>

              {/* Main Heading */}
              <motion.h1
                id="hero-heading"
                variants={fadeUp}
                custom={1}
                className="heading-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl mb-6"
              >
                Taste the{' '}
                <span className="text-maroon">Warmth</span>
                <br />
                of Home
              </motion.h1>

              {/* Description */}
              <motion.p
                variants={fadeUp}
                custom={2}
                className="text-body text-lg max-w-lg mx-auto lg:mx-0 mb-8"
              >
                Authentic flavours, lovingly prepared and delivered fresh from{' '}
                <strong className="text-forest font-semibold">KSN AAHAAR</strong>.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                variants={fadeUp}
                custom={3}
                className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start"
              >
                <Link href="/menu">
                  <Button size="lg" icon={<ArrowRightIcon className="w-4 h-4" />} iconPosition="right">
                    Order Now
                  </Button>
                </Link>
                <Link href="/menu">
                  <Button size="lg" variant="outline">
                    Explore Menu
                  </Button>
                </Link>
              </motion.div>

              {/* Quick Stats */}
              <motion.div
                variants={fadeUp}
                custom={4}
                className="flex items-center gap-6 mt-10 justify-center lg:justify-start"
              >
                <div className="text-center">
                  <p className="font-heading font-bold text-2xl text-forest">50+</p>
                  <p className="text-xs text-neutral-500 mt-0.5">Menu Items</p>
                </div>
                <div className="w-px h-10 bg-neutral-200" />
                <div className="text-center">
                  <p className="font-heading font-bold text-2xl text-forest">4.8★</p>
                  <p className="text-xs text-neutral-500 mt-0.5">Customer Rating</p>
                </div>
                <div className="w-px h-10 bg-neutral-200" />
                <div className="text-center">
                  <p className="font-heading font-bold text-2xl text-forest">30min</p>
                  <p className="text-xs text-neutral-500 mt-0.5">Avg. Delivery</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Hero Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
              className="relative order-1 lg:order-2"
            >
              <div className="relative aspect-square lg:aspect-[4/3] rounded-2xl overflow-hidden shadow-elevated">
                <Image
                  src="/images/hero-food.jpg"
                  alt="Aromatic Chicken Dum Biryani served in a traditional copper handi with raita and curry"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
                {/* Subtle overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-forest/10 to-transparent" />
              </div>
              {/* Decorative gold accent */}
              <div className="hidden lg:block absolute -bottom-4 -left-4 w-24 h-24 border-2 border-gold/30 rounded-2xl -z-10" />
              <div className="hidden lg:block absolute -top-4 -right-4 w-16 h-16 border-2 border-gold/20 rounded-full -z-10" />
            </motion.div>
          </div>
        </div>

        {/* Subtle background decoration */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-gold/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-forest/5 rounded-full blur-3xl -z-10" />
      </section>

      {/* ═══════════════════════════════════
          TRUST / BRAND INTRODUCTION
          ═══════════════════════════════════ */}
      <section className="py-16 bg-white" aria-labelledby="trust-heading">
        <div className="container-main">
          <h2 id="trust-heading" className="sr-only">Why Choose KSN AAHAAR</h2>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={stagger}
            className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8"
          >
            {TRUST_ITEMS.map((item, i) => (
              <motion.div
                key={item.title}
                variants={fadeUp}
                custom={i}
                className="text-center p-6 rounded-xl hover:bg-cream transition-colors duration-300"
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-forest/5 flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-forest" />
                </div>
                <h3 className="font-heading font-semibold text-forest text-sm mb-1.5">
                  {item.title}
                </h3>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          FEATURED PRODUCTS
          ═══════════════════════════════════ */}
      <section className="py-16 lg:py-20" aria-labelledby="featured-heading">
        <div className="container-main">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={stagger}
            className="text-center mb-10"
          >
            <motion.p variants={fadeUp} custom={0} className="text-caption text-gold-dark mb-3">
              Our Favourites
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="heading-section text-3xl lg:text-4xl mb-3">
              Made Fresh, Loved Always
            </motion.h2>
            <motion.div variants={fadeUp} custom={2}>
              <div className="gold-line w-24 mx-auto mb-4" />
              <p className="text-body max-w-lg mx-auto">
                Our most popular dishes, prepared with authentic recipes and the freshest ingredients.
              </p>
            </motion.div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-10"
          >
            <Link href="/menu">
              <Button variant="outline" size="lg" icon={<ArrowRightIcon className="w-4 h-4" />} iconPosition="right">
                View Full Menu
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          CATEGORY CARDS
          ═══════════════════════════════════ */}
      <section className="py-16 lg:py-20 bg-white" aria-labelledby="categories-heading">
        <div className="container-main">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={stagger}
            className="text-center mb-10"
          >
            <motion.p variants={fadeUp} custom={0} className="text-caption text-gold-dark mb-3">
              Explore
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="heading-section text-3xl lg:text-4xl mb-3">
              Browse by Category
            </motion.h2>
            <motion.div variants={fadeUp} custom={2}>
              <div className="gold-line w-24 mx-auto" />
            </motion.div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={stagger}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6"
          >
            {CATEGORIES.map((cat, i) => (
              <motion.div key={cat.id} variants={fadeUp} custom={i}>
                <Link
                  href={`/menu?category=${cat.slug}`}
                  className="group block relative aspect-[3/2] rounded-xl overflow-hidden shadow-soft hover:shadow-card transition-all duration-300"
                >
                  {/* Background — uses a warm gradient placeholder since we don't have category images yet */}
                  <div className="absolute inset-0 bg-gradient-to-br from-forest/80 to-forest-dark/90" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                  {/* Content */}
                  <div className="relative h-full flex flex-col items-center justify-center p-4 text-center">
                    <h3 className="font-heading font-semibold text-white text-base lg:text-lg mb-1 group-hover:text-gold transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-white/60 text-xs">
                      {cat.itemCount} items
                    </p>
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gold/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          ABOUT / BRAND STORY TEASER
          ═══════════════════════════════════ */}
      <section className="py-16 lg:py-20" aria-labelledby="about-heading">
        <div className="container-main">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
              className="relative"
            >
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-elevated">
                <Image
                  src="/images/hero-food.jpg"
                  alt="Traditional Indian food preparation"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              <div className="hidden lg:block absolute -bottom-4 -right-4 w-20 h-20 border-2 border-gold/30 rounded-xl -z-10" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <p className="text-caption text-gold-dark mb-3">Our Story</p>
              <h2 id="about-heading" className="heading-section text-3xl lg:text-4xl mb-4">
                Food Made with Love,
                <br />
                <span className="text-maroon">Just Like Home</span>
              </h2>
              <div className="gold-line w-16 mb-6" />
              <div className="space-y-4 text-body">
                <p>
                  At KSN AAHAAR, we believe that the best food comes from the heart. Every dish we prepare carries the warmth of traditional home cooking — authentic recipes passed down through generations, made with carefully selected ingredients and genuine care.
                </p>
                <p>
                  From aromatic biriyanis to traditional sweets, each item on our menu reflects the rich culinary heritage of Andhra and Hyderabadi cuisine. We don&apos;t just cook food — we craft meals that bring families together.
                </p>
              </div>
              <div className="mt-6 flex flex-wrap gap-4">
                <Link href="/about">
                  <Button variant="outline">Read Our Story</Button>
                </Link>
                <Link href="/menu">
                  <Button variant="ghost" icon={<ArrowRightIcon className="w-4 h-4" />} iconPosition="right">
                    Explore Menu
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          CTA BANNER
          ═══════════════════════════════════ */}
      <section className="py-16 lg:py-20 bg-forest relative overflow-hidden" aria-labelledby="cta-heading">
        {/* Decorative bg elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5">
          <div className="absolute top-10 left-10 w-40 h-40 bg-gold rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-gold rounded-full blur-3xl" />
        </div>

        <div className="container-main relative text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={stagger}
          >
            <motion.p variants={fadeUp} custom={0} className="text-gold text-xs uppercase tracking-[0.2em] font-medium mb-4">
              Ready to Order?
            </motion.p>
            <motion.h2
              id="cta-heading"
              variants={fadeUp}
              custom={1}
              className="font-heading font-bold text-3xl lg:text-5xl text-white mb-4"
            >
              Craving Something
              <br />
              <span className="text-gold">Delicious?</span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-white/70 max-w-md mx-auto mb-8">
              Browse our menu, pick your favourites, and we&apos;ll have them prepared fresh and delivered to your door.
            </motion.p>
            <motion.div variants={fadeUp} custom={3}>
              <Link href="/menu">
                <Button size="xl" variant="gold" icon={<ArrowRightIcon className="w-5 h-5" />} iconPosition="right">
                  Order Now
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
