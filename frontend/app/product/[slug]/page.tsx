'use client';

import { useState, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { notFound } from 'next/navigation';
import type { Product, ProductVariant } from '@/types';
import { PRODUCTS } from '@/lib/constants';
import { formatPrice, cn } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';
import { DietBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ProductCard from '@/components/product/ProductCard';

/* ── Icons ── */
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

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
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

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const product = PRODUCTS.find((p) => p.slug === slug);

  if (!product) {
    notFound();
  }

  return <ProductDetail product={product} />;
}

function ProductDetail({ product }: { product: Product }) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(
    product.variants.find((v) => v.isAvailable) ?? product.variants[0]
  );
  const [addedFeedback, setAddedFeedback] = useState(false);
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
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1500);
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

  // Related products: same category, excluding current
  const relatedProducts = PRODUCTS.filter(
    (p) => p.categorySlug === product.categorySlug && p.id !== product.id && p.isAvailable
  ).slice(0, 3);

  return (
    <>
      {/* ── Breadcrumb ── */}
      <div className="bg-white border-b border-neutral-200">
        <div className="container-main py-3 flex items-center gap-2 text-xs">
          <Link href="/menu" className="text-neutral-500 hover:text-forest transition-colors flex items-center gap-1">
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            Menu
          </Link>
          <span className="text-neutral-300">/</span>
          <Link href={`/menu?category=${product.categorySlug}`} className="text-neutral-500 hover:text-forest transition-colors">
            {product.category}
          </Link>
          <span className="text-neutral-300">/</span>
          <span className="text-forest font-medium">{product.name}</span>
        </div>
      </div>

      {/* ── Product Detail ── */}
      <section className="py-8 lg:py-12">
        <div className="container-main">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
              className="relative"
            >
              <div className="relative aspect-square lg:aspect-[4/3] rounded-2xl overflow-hidden shadow-elevated bg-neutral-100">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  placeholder="blur"
                  blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjRjVFREQ4Ii8+PC9zdmc+"
                />
                {/* Featured badge */}
                {product.isFeatured && (
                  <span className="absolute top-4 left-4 z-10 px-3 py-1.5 bg-gold/90 text-white text-xs font-bold uppercase tracking-wider rounded-full backdrop-blur-sm">
                    ★ Featured
                  </span>
                )}
                {/* Unavailable overlay */}
                {!product.isAvailable && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
                    <span className="px-6 py-3 bg-neutral-800/80 text-white text-base font-medium rounded-lg">
                      Currently Unavailable
                    </span>
                  </div>
                )}
              </div>
              {/* Decorative */}
              <div className="hidden lg:block absolute -bottom-4 -left-4 w-24 h-24 border-2 border-gold/20 rounded-2xl -z-10" />
              <div className="hidden lg:block absolute -top-4 -right-4 w-16 h-16 border-2 border-gold/15 rounded-full -z-10" />
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
              className="flex flex-col"
            >
              {/* Diet Badge */}
              <DietBadge isVeg={product.isVeg} className="mb-3" />

              {/* Category */}
              <Link
                href={`/menu?category=${product.categorySlug}`}
                className="text-xs font-medium uppercase tracking-wider text-gold-dark hover:text-gold transition-colors mb-2"
              >
                {product.category}
              </Link>

              {/* Name */}
              <h1 className="font-heading font-bold text-3xl lg:text-4xl text-forest mb-3 leading-tight">
                {product.name}
              </h1>

              {/* Description */}
              <p className="text-body text-base lg:text-lg mb-6 leading-relaxed">
                {product.description}
              </p>

              {/* Ingredients */}
              {product.ingredients && product.ingredients.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">Ingredients</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.ingredients.map((ing) => (
                      <span
                        key={ing}
                        className="px-2.5 py-1 bg-cream-dark text-neutral-600 text-xs font-medium rounded-md"
                      >
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Serving Info */}
              {product.servingInfo && (
                <p className="text-xs text-neutral-500 mb-6 italic">
                  {product.servingInfo}
                </p>
              )}

              {/* Variant Selector */}
              {product.variants.length > 1 && (
                <div className="mb-6">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3">Select Size</h3>
                  <div className="flex gap-3">
                    {product.variants.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariant(variant)}
                        disabled={!variant.isAvailable}
                        className={cn(
                          'flex-1 max-w-[180px] p-4 rounded-xl border-2 text-center transition-all duration-200',
                          selectedVariant.id === variant.id
                            ? 'bg-forest/5 border-forest'
                            : variant.isAvailable
                              ? 'bg-white border-neutral-200 hover:border-forest/30'
                              : 'bg-neutral-100 border-neutral-200 cursor-not-allowed opacity-60'
                        )}
                        aria-pressed={selectedVariant.id === variant.id}
                      >
                        <p className={cn(
                          'font-semibold text-sm mb-0.5',
                          selectedVariant.id === variant.id ? 'text-forest' : 'text-neutral-700'
                        )}>
                          {variant.name}
                        </p>
                        <p className={cn(
                          'text-lg font-bold',
                          selectedVariant.id === variant.id ? 'text-forest' : 'text-neutral-600'
                        )}>
                          {formatPrice(variant.price)}
                        </p>
                        {!variant.isAvailable && (
                          <p className="text-[10px] text-neutral-400 mt-1">Unavailable</p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Price & Add to Cart */}
              <div className="mt-auto pt-6 border-t border-neutral-200">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Price</p>
                    <p className="price text-3xl">{formatPrice(selectedVariant.price)}</p>
                  </div>

                  {product.isAvailable && selectedVariant.isAvailable ? (
                    currentQty > 0 ? (
                      <div className="flex items-center gap-3">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1 bg-forest rounded-xl overflow-hidden">
                          <button
                            onClick={handleDecrement}
                            className="w-11 h-11 flex items-center justify-center text-white hover:bg-forest-light transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <MinusIcon className="w-4 h-4" />
                          </button>
                          <span className="w-10 h-11 flex items-center justify-center text-white text-lg font-bold" aria-live="polite">
                            {currentQty}
                          </span>
                          <button
                            onClick={handleIncrement}
                            className="w-11 h-11 flex items-center justify-center text-white hover:bg-forest-light transition-colors"
                            aria-label="Increase quantity"
                          >
                            <PlusIcon className="w-4 h-4" />
                          </button>
                        </div>
                        <Link href="/cart">
                          <Button size="lg" variant="gold" icon={<CartIcon className="w-5 h-5" />}>
                            View Cart
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <Button
                        size="lg"
                        onClick={handleAdd}
                        icon={
                          addedFeedback
                            ? <CheckIcon className="w-5 h-5" />
                            : <CartIcon className="w-5 h-5" />
                        }
                      >
                        {addedFeedback ? 'Added!' : 'Add to Cart'}
                      </Button>
                    )
                  ) : (
                    <span className="text-sm text-neutral-400 font-medium bg-neutral-100 px-6 py-3 rounded-lg">
                      Currently Unavailable
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Related Products ── */}
      {relatedProducts.length > 0 && (
        <section className="py-12 lg:py-16 bg-white">
          <div className="container-main">
            <div className="text-center mb-8">
              <p className="text-caption text-gold-dark mb-2">You may also like</p>
              <h2 className="heading-section text-2xl lg:text-3xl">More from {product.category}</h2>
              <div className="gold-line w-20 mx-auto mt-3" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
              {relatedProducts.map((rp, i) => (
                <ProductCard key={rp.id} product={rp} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
