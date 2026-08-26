'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { Product, ProductVariant } from '@/types';
import { formatPrice, cn } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';
import { DietBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

interface ProductCardProps {
  product: Product;
  index?: number;
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

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(
    product.variants.find((v) => v.isAvailable) ?? product.variants[0]
  );
  const [imgError, setImgError] = useState(false);
  const { addItem, getItemQuantity, updateQuantity, removeItem } = useCart();

  const currentQty = getItemQuantity(product.id, selectedVariant.id);

  const handleAdd = () => {
    addItem({
      productId: product.id,
      variantId: selectedVariant.id,
      productName: product.name,
      variantName: selectedVariant.name,
      price: selectedVariant.price,
      quantity: 1,
      image: product.image,
      isVeg: product.isVeg,
    });
  };

  const handleIncrement = () => {
    updateQuantity(product.id, selectedVariant.id, currentQty + 1);
  };

  const handleDecrement = () => {
    if (currentQty <= 1) {
      removeItem(product.id, selectedVariant.id);
    } else {
      updateQuantity(product.id, selectedVariant.id, currentQty - 1);
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.25, 0.1, 0.25, 1] }}
      className="group bg-white rounded-xl overflow-hidden shadow-soft hover:shadow-card transition-shadow duration-300"
    >
      {/* Image */}
      <Link href={`/product/${product.slug}`} className="block relative aspect-[4/3] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {imgError ? (
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100 flex flex-col items-center justify-center">
            <span className="text-4xl mb-1">{product.isVeg ? '🥗' : '🍗'}</span>
            <span className="text-[10px] text-neutral-400 font-medium">{product.category}</span>
          </div>
        ) : (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjRjVFREQ4Ii8+PC9zdmc+"
            onError={() => setImgError(true)}
          />
        )}
        {/* Featured badge */}
        {product.isFeatured && (
          <span className="absolute top-3 left-3 z-20 px-2.5 py-1 bg-gold/90 text-white text-[10px] font-bold uppercase tracking-wider rounded-full backdrop-blur-sm">
            ★ Featured
          </span>
        )}
        {/* Unavailable overlay */}
        {!product.isAvailable && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex items-center justify-center">
            <span className="px-4 py-2 bg-neutral-800/80 text-white text-sm font-medium rounded-lg">
              Currently Unavailable
            </span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-4">
        {/* Diet Badge */}
        <DietBadge isVeg={product.isVeg} className="mb-2" />

        {/* Name */}
        <Link href={`/product/${product.slug}`}>
          <h3 className="font-heading font-semibold text-forest text-base leading-snug mb-1 group-hover:text-forest-light transition-colors line-clamp-1">
            {product.name}
          </h3>
        </Link>

        {/* Description */}
        <p className="text-neutral-500 text-xs leading-relaxed mb-3 line-clamp-2">
          {product.shortDescription}
        </p>

        {/* Variant Selector */}
        {product.variants.length > 1 && (
          <div className="flex gap-1.5 mb-3">
            {product.variants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => setSelectedVariant(variant)}
                disabled={!variant.isAvailable}
                className={cn(
                  'px-2.5 py-1 text-[11px] font-medium rounded-md border transition-all duration-200',
                  selectedVariant.id === variant.id
                    ? 'bg-forest text-white border-forest'
                    : variant.isAvailable
                      ? 'bg-cream border-neutral-200 text-neutral-600 hover:border-forest/30'
                      : 'bg-neutral-100 border-neutral-200 text-neutral-400 cursor-not-allowed line-through'
                )}
                aria-label={`${variant.name} — ${formatPrice(variant.price)}`}
                aria-pressed={selectedVariant.id === variant.id}
              >
                {variant.name}
              </button>
            ))}
          </div>
        )}

        {/* Price & Add */}
        <div className="flex items-center justify-between gap-2">
          <span className="price text-lg">
            {formatPrice(selectedVariant.price)}
          </span>

          {product.isAvailable && selectedVariant.isAvailable ? (
            currentQty > 0 ? (
              <div className="flex items-center gap-0.5 bg-forest rounded-lg overflow-hidden">
                <button
                  onClick={handleDecrement}
                  className="w-8 h-8 flex items-center justify-center text-white hover:bg-forest-light transition-colors"
                  aria-label="Decrease quantity"
                >
                  <MinusIcon className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 h-8 flex items-center justify-center text-white text-sm font-bold" aria-live="polite">
                  {currentQty}
                </span>
                <button
                  onClick={handleIncrement}
                  className="w-8 h-8 flex items-center justify-center text-white hover:bg-forest-light transition-colors"
                  aria-label="Increase quantity"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <Button size="sm" onClick={handleAdd}>
                Add
              </Button>
            )
          ) : (
            <span className="text-xs text-neutral-400 font-medium">Unavailable</span>
          )}
        </div>
      </div>
    </motion.article>
  );
}
