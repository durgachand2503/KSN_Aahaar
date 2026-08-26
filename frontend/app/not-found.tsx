'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';

export default function NotFound() {
  return (
    <section className="min-h-[calc(100vh-10rem)] flex items-center justify-center py-16">
      <div className="container-main">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-md mx-auto"
        >
          {/* 404 Badge */}
          <div className="relative inline-block mb-6">
            <span className="text-8xl lg:text-9xl font-heading font-bold text-forest/10">404</span>
            <span className="absolute inset-0 flex items-center justify-center text-5xl">🍽️</span>
          </div>

          <h1 className="font-heading font-bold text-2xl lg:text-3xl text-forest mb-3">
            Page Not Found
          </h1>
          <p className="text-body text-sm lg:text-base mb-8 max-w-sm mx-auto">
            Oops! The page you&apos;re looking for seems to have gone missing. Perhaps it&apos;s still cooking?
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/">
              <Button size="lg">Go Home</Button>
            </Link>
            <Link href="/menu">
              <Button size="lg" variant="outline">Browse Menu</Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
