'use client';

import { Suspense, useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '@/components/product/ProductCard';
import { PRODUCTS, CATEGORIES, BRAND } from '@/lib/constants';
import { cn } from '@/lib/utils';

/* ── Icons ── */
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function FilterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
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

/* ── Sort options ── */
type SortOption = 'popular' | 'price-low' | 'price-high' | 'name-az';
const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'name-az', label: 'Name: A–Z' },
];

/* ── Animation variants ── */
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: i * 0.03, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

export default function MenuPage() {
  return (
    <Suspense fallback={<MenuSkeleton />}>
      <MenuPageContent />
    </Suspense>
  );
}

function MenuSkeleton() {
  return (
    <section className="py-16">
      <div className="container-main text-center">
        <div className="w-8 h-8 mx-auto border-2 border-forest/30 border-t-forest rounded-full animate-spin" />
      </div>
    </section>
  );
}

function MenuPageContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';

  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [vegOnly, setVegOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [showFilters, setShowFilters] = useState(false);

  // Debounced search
  const debouncedSetSearch = useMemo(
    () => {
      let timeout: ReturnType<typeof setTimeout>;
      return (value: string) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => setDebouncedSearch(value), 300);
      };
    },
    []
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchQuery(value);
      debouncedSetSearch(value);
    },
    [debouncedSetSearch]
  );

  const clearSearch = () => {
    setSearchQuery('');
    setDebouncedSearch('');
  };

  // Filter & sort products
  const filteredProducts = useMemo(() => {
    let items = [...PRODUCTS];

    // Category filter
    if (activeCategory !== 'all') {
      items = items.filter((p) => p.categorySlug === activeCategory);
    }

    // Veg filter
    if (vegOnly) {
      items = items.filter((p) => p.isVeg);
    }

    // Search filter
    if (debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.shortDescription.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          (p.ingredients && p.ingredients.some((ing) => ing.toLowerCase().includes(query)))
      );
    }

    // Sort
    switch (sortBy) {
      case 'popular':
        items.sort((a, b) => b.popularity - a.popularity);
        break;
      case 'price-low':
        items.sort((a, b) => a.variants[0].price - b.variants[0].price);
        break;
      case 'price-high':
        items.sort((a, b) => b.variants[0].price - a.variants[0].price);
        break;
      case 'name-az':
        items.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return items;
  }, [activeCategory, vegOnly, debouncedSearch, sortBy]);

  const activeCount = filteredProducts.length;
  const activeCategoryName =
    activeCategory === 'all'
      ? 'All Items'
      : CATEGORIES.find((c) => c.slug === activeCategory)?.name ?? 'All Items';

  return (
    <>
      {/* ── Page Header ── */}
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
            <p className="text-gold text-xs uppercase tracking-[0.2em] font-medium mb-3">
              {BRAND.name}
            </p>
            <h1 className="font-heading font-bold text-3xl lg:text-5xl text-white mb-3">
              Our <span className="text-gold">Menu</span>
            </h1>
            <p className="text-white/60 max-w-lg mx-auto text-sm lg:text-base">
              Authentic flavours, lovingly prepared. Browse our full selection of biryanis, curries, sweets, and more.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Sticky Filters Bar ── */}
      <div className="sticky top-[4.5rem] z-30 bg-cream/95 backdrop-blur-md border-b border-neutral-200">
        <div className="container-main">
          {/* Category Tabs — horizontally scrollable */}
          <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveCategory('all')}
              className={cn(
                'flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wide transition-all duration-200',
                activeCategory === 'all'
                  ? 'bg-forest text-white shadow-soft'
                  : 'bg-white text-neutral-600 hover:bg-cream-dark border border-neutral-200'
              )}
            >
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.slug)}
                className={cn(
                  'flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wide transition-all duration-200',
                  activeCategory === cat.slug
                    ? 'bg-forest text-white shadow-soft'
                    : 'bg-white text-neutral-600 hover:bg-cream-dark border border-neutral-200'
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Search + Controls Row */}
          <div className="flex items-center gap-3 pb-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="search"
                placeholder="Search dishes, ingredients..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-9 py-2.5 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors"
                aria-label="Search menu"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  aria-label="Clear search"
                >
                  <CloseIcon className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Veg Toggle */}
            <button
              onClick={() => setVegOnly(!vegOnly)}
              className={cn(
                'flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wide border transition-all duration-200 flex-shrink-0',
                vegOnly
                  ? 'bg-veg text-white border-veg'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:border-veg/40'
              )}
              aria-pressed={vegOnly}
              aria-label="Show vegetarian items only"
            >
              <span className={cn('w-3 h-3 rounded-sm border-2', vegOnly ? 'border-white' : 'border-veg')}>
                <span className={cn('block w-1.5 h-1.5 rounded-full mx-auto mt-px', vegOnly ? 'bg-white' : 'bg-veg')} />
              </span>
              <span className="hidden sm:inline">Veg Only</span>
            </button>

            {/* Filter/Sort Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wide border transition-all duration-200 flex-shrink-0',
                showFilters
                  ? 'bg-forest text-white border-forest'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:border-forest/40'
              )}
              aria-expanded={showFilters}
              aria-label="Toggle sort and filter options"
            >
              <FilterIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Sort</span>
            </button>
          </div>

          {/* Sort Dropdown (animated) */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-2 pb-3 flex-wrap">
                  <span className="text-xs text-neutral-500 font-medium mr-1">Sort by:</span>
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setSortBy(opt.value);
                        setShowFilters(false);
                      }}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-[11px] font-medium transition-all',
                        sortBy === opt.value
                          ? 'bg-gold text-white'
                          : 'bg-white border border-neutral-200 text-neutral-600 hover:border-gold/40'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Results Info ── */}
      <section className="py-6 lg:py-8">
        <div className="container-main">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-heading font-semibold text-xl lg:text-2xl text-forest">
                {activeCategoryName}
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                {activeCount} {activeCount === 1 ? 'item' : 'items'}
                {vegOnly && ' (Veg only)'}
                {debouncedSearch && ` matching "${debouncedSearch}"`}
              </p>
            </div>
          </div>

          {/* ── Product Grid ── */}
          {activeCount > 0 ? (
            <motion.div
              key={`${activeCategory}-${vegOnly}-${debouncedSearch}-${sortBy}`}
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6"
            >
              {filteredProducts.map((product, i) => (
                <motion.div key={product.id} variants={fadeUp} custom={i}>
                  <ProductCard product={product} index={i} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
                <SearchIcon className="w-7 h-7 text-neutral-400" />
              </div>
              <h3 className="font-heading font-semibold text-lg text-forest mb-2">No items found</h3>
              <p className="text-sm text-neutral-500 mb-6 max-w-sm mx-auto">
                {debouncedSearch
                  ? `We couldn't find any dishes matching "${debouncedSearch}". Try a different search term.`
                  : 'No items match your current filters. Try adjusting your selections.'}
              </p>
              <button
                onClick={() => {
                  setActiveCategory('all');
                  setVegOnly(false);
                  clearSearch();
                  setSortBy('popular');
                }}
                className="px-5 py-2.5 bg-forest text-white text-sm font-semibold rounded-lg hover:bg-forest-light transition-colors"
              >
                Clear All Filters
              </button>
            </motion.div>
          )}
        </div>
      </section>
    </>
  );
}
