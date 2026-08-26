'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { BRAND } from '@/lib/constants';
import Button from '@/components/ui/Button';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

const values = [
  {
    icon: '🏡',
    title: 'Home-Cooked Goodness',
    description: 'Every dish is prepared in a home kitchen with the same love and care as a family meal. No industrial shortcuts.',
  },
  {
    icon: '🌿',
    title: 'Fresh Ingredients',
    description: 'We source the freshest vegetables, spices, and meats daily from local suppliers. Quality you can taste.',
  },
  {
    icon: '✨',
    title: 'Authentic Recipes',
    description: 'Traditional recipes passed down through generations, preserving the authentic flavours of Andhra & Hyderabadi cuisine.',
  },
  {
    icon: '🚚',
    title: 'Fast Delivery',
    description: 'Hot, fresh food delivered to your doorstep within 30-45 minutes. Because great food shouldn\'t wait.',
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-forest relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-40 h-40 bg-gold rounded-full blur-3xl" />
          <div className="absolute bottom-5 right-20 w-60 h-60 bg-gold rounded-full blur-3xl" />
        </div>
        <div className="container-main py-14 lg:py-20 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-2xl mx-auto"
          >
            <p className="text-gold text-xs uppercase tracking-[0.2em] font-medium mb-3">Our Story</p>
            <h1 className="font-heading font-bold text-3xl lg:text-5xl text-white mb-4">
              About <span className="text-gold">{BRAND.name}</span>
            </h1>
            <p className="text-white/60 text-sm lg:text-base leading-relaxed">
              A home cloud kitchen born from a simple belief — that the best food comes from the heart. We bring you authentic, home-cooked meals that taste just like your mother&apos;s cooking.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-14 lg:py-20">
        <div className="container-main">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-caption text-gold-dark mb-2">How It Started</p>
              <h2 className="heading-section text-2xl lg:text-3xl mb-6">From Our Home Kitchen to Your Table</h2>
              <div className="space-y-4 text-body text-sm lg:text-base leading-relaxed">
                <p>
                  {BRAND.name} started as a passion project — cooking for friends and family who kept coming back for more. What began as small batches of biryani and homemade sweets quickly grew into something bigger.
                </p>
                <p>
                  Today, we serve the community of Miyapur and surrounding areas in Hyderabad, delivering the same home-cooked taste that started it all. Our menu features authentic Andhra and Hyderabadi dishes, prepared fresh every day.
                </p>
                <p>
                  We believe food is more than sustenance — it&apos;s love, tradition, and community. Every order is prepared with the same care we&apos;d put into feeding our own family.
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative"
            >
              <div className="aspect-[4/3] rounded-2xl bg-forest/10 flex items-center justify-center text-6xl">
                🍛
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 border-2 border-gold/20 rounded-2xl -z-10" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-14 lg:py-20 bg-white">
        <div className="container-main">
          <div className="text-center mb-12">
            <p className="text-caption text-gold-dark mb-2">What Drives Us</p>
            <h2 className="heading-section text-2xl lg:text-3xl">Our Values</h2>
            <div className="gold-line w-20 mx-auto mt-3" />
          </div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {values.map((value, i) => (
              <motion.div
                key={value.title}
                variants={fadeUp}
                custom={i}
                className="bg-cream rounded-xl p-6 text-center shadow-soft hover:shadow-elevated transition-shadow"
              >
                <span className="text-4xl mb-4 block">{value.icon}</span>
                <h3 className="font-heading font-semibold text-base text-forest mb-2">{value.title}</h3>
                <p className="text-xs text-body leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 lg:py-20 bg-forest">
        <div className="container-main text-center">
          <h2 className="font-heading font-bold text-2xl lg:text-3xl text-white mb-4">
            Ready to Taste the Difference?
          </h2>
          <p className="text-white/60 text-sm max-w-lg mx-auto mb-8">
            Browse our menu and order your favourite home-cooked meal. Free delivery on orders above ₹500!
          </p>
          <Link href="/menu">
            <Button size="lg" variant="gold">
              Explore Our Menu
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}
