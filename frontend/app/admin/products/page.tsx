'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import {
  getAdminProducts, getAdminCategories,
  deleteAdminProduct, restoreAdminProduct,
  toggleProductAvailability, toggleProductFeatured, toggleProductBestSeller, toggleProductNew,
  type AdminProduct, type AdminCategory,
} from '@/lib/api';
import { formatPrice, cn } from '@/lib/utils';
import { getMediaUrl } from '@/lib/constants';
import ProductForm from '@/components/admin/ProductForm';

/* ── Icons ── */
const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
  </svg>
);
const RefreshIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" />
  </svg>
);
const TrashIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);
const EditIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" />
  </svg>
);
const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-4 h-4">
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const RestoreIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
  </svg>
);

/* ── Toggle ── */
function Toggle({ checked, onChange, disabled, colorOn = 'bg-forest' }: {
  checked: boolean; onChange: () => void; disabled?: boolean; colorOn?: string;
}) {
  return (
    <button
      onClick={onChange} disabled={disabled}
      className={cn(
        'relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 disabled:opacity-40 cursor-pointer',
        checked ? colorOn : 'bg-neutral-200'
      )}
    >
      <span className={cn(
        'inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200',
        checked ? 'translate-x-[18px]' : 'translate-x-0.5'
      )} />
    </button>
  );
}

/* ── Archive Confirmation Modal ── */
function ArchiveModal({ product, onConfirm, onCancel }: {
  product: AdminProduct; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
      onClick={onCancel}
    >
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-modal border border-neutral-100"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-11 h-11 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
          <TrashIcon className="w-5 h-5 text-amber-600" />
        </div>
        <h3 className="font-heading font-bold text-lg text-center text-neutral-800 mb-1">Archive Product?</h3>
        <p className="text-sm text-neutral-500 text-center mb-2">
          <span className="font-semibold text-neutral-700">{product.name}</span> will be hidden from the menu.
        </p>
        <p className="text-xs text-neutral-400 text-center mb-6">You can restore it later from the Archived tab.</p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition-colors">
            Archive
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Admin Product Card ── */
function AdminProductCard({ product, token, onArchive, onRestore, onEdit, onUpdate }: {
  product: AdminProduct; token: string;
  onArchive: (p: AdminProduct) => void;
  onRestore: (p: AdminProduct) => void;
  onEdit: (p: AdminProduct) => void;
  onUpdate: (p: AdminProduct) => void;
}) {
  const [toggling, setToggling] = useState<string | null>(null);

  const handleToggle = async (type: 'availability' | 'featured' | 'bestseller' | 'new') => {
    setToggling(type);
    let res;
    if (type === 'availability') res = await toggleProductAvailability(product._id, token);
    else if (type === 'featured') res = await toggleProductFeatured(product._id, token);
    else if (type === 'bestseller') res = await toggleProductBestSeller(product._id, token);
    else res = await toggleProductNew(product._id, token);
    if (res.success && res.data) onUpdate(res.data);
    setToggling(null);
  };

  const prices = product.variants?.map(v => v.price) || [0];
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);

  const imageUrl = product.image ? getMediaUrl(product.image) : null;

  const isArchived = !product.isActive;

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
      className={cn(
        'bg-white rounded-xl border shadow-soft hover:shadow-card transition-all group flex flex-col overflow-hidden',
        isArchived && 'opacity-60 border-neutral-200',
        !product.isAvailable && !isArchived && 'border-maroon/15'
      )}>
      {/* Status strip */}
      <div className={cn('h-1 flex-shrink-0',
        isArchived ? 'bg-neutral-300' :
        product.isBestSeller ? 'bg-gold' :
        product.isFeatured ? 'bg-amber-400' :
        product.isAvailable ? 'bg-forest' : 'bg-maroon'
      )} />

      {/* Image */}
      {imageUrl && (
        <div className="aspect-[4/3] bg-cream overflow-hidden flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
      )}

      <div className="p-4 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className={cn('w-2 h-2 rounded-full flex-shrink-0', product.isVeg ? 'bg-veg' : 'bg-nonveg')} />
              <h3 className="text-neutral-800 font-semibold text-sm leading-tight truncate">{product.name}</h3>
            </div>
            <p className="text-neutral-400 text-[11px] pl-3.5 truncate">{product.categoryName}</p>
          </div>
          {/* Actions */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button onClick={() => onEdit(product)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-forest hover:bg-forest/10 transition-all">
              <EditIcon className="w-3.5 h-3.5" />
            </button>
            {isArchived ? (
              <button onClick={() => onRestore(product)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-sky-600 hover:bg-sky-50 transition-all">
                <RestoreIcon className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button onClick={() => onArchive(product)}
                className="p-1.5 rounded-lg text-neutral-300 hover:text-amber-600 hover:bg-amber-50 transition-all">
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Price */}
        <p className="text-forest font-bold text-base mb-2">
          {minP === maxP ? formatPrice(minP) : `${formatPrice(minP)} – ${formatPrice(maxP)}`}
          {product.variants?.length > 1 && (
            <span className="text-neutral-400 font-normal text-xs ml-1">({product.variants.length} sizes)</span>
          )}
        </p>

        {/* Badges */}
        <div className="flex gap-1 flex-wrap mb-3">
          {product.isBestSeller && (
            <span key="bestseller" className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-gold/12 text-gold-dark border border-gold/20">🔥 Best Seller</span>
          )}
          {product.isFeatured && (
            <span key="featured" className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">⭐ Featured</span>
          )}
          {product.isNewItem && (
            <span key="new" className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-sky-50 text-sky-700 border border-sky-200">🆕 New</span>
          )}
          {isArchived && (
            <span key="archived" className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-neutral-100 text-neutral-500 border border-neutral-200">Archived</span>
          )}
          {!product.isAvailable && !isArchived && (
            <span key="unavailable" className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-maroon/8 text-maroon border border-maroon/15">Unavailable</span>
          )}
        </div>

        {/* Toggles (only for active products) */}
        {!isArchived && (
          <div className="space-y-2 pt-3 border-t border-neutral-100 mt-auto">
            {[
              { key: 'availability' as const, label: 'Available', checked: product.isAvailable, colorOn: 'bg-forest' },
              { key: 'featured' as const, label: 'Featured', checked: product.isFeatured, colorOn: 'bg-amber-500' },
              { key: 'bestseller' as const, label: 'Best Seller', checked: product.isBestSeller, colorOn: 'bg-gold' },
              { key: 'new' as const, label: 'New Badge', checked: product.isNewItem, colorOn: 'bg-sky-500' },
            ].map(({ key, label, checked, colorOn }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-neutral-500 text-xs">{label}</span>
                <Toggle checked={checked} onChange={() => handleToggle(key)}
                  disabled={toggling === key} colorOn={colorOn} />
              </div>
            ))}
          </div>
        )}

        {/* Restore button for archived */}
        {isArchived && (
          <div className="pt-3 border-t border-neutral-100 mt-auto">
            <button onClick={() => onRestore(product)}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-forest/8 text-forest text-xs font-semibold hover:bg-forest/15 transition-colors">
              <RestoreIcon className="w-3.5 h-3.5" />Restore
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════ */
type ViewMode = 'active' | 'archived';
type FilterMode = 'all' | 'veg' | 'non-veg' | 'featured' | 'bestseller' | 'unavailable';

export default function AdminProductsPage() {
  const { isAuthenticated } = useAdminAuth();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('active');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('displayOrder');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);

  // Modals
  const [toArchive, setToArchive] = useState<AdminProduct | null>(null);
  const [archiving, setArchiving] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch categories on mount
  useEffect(() => {
    if (!isAuthenticated) return;
    getAdminCategories('').then(res => {
      if (res.success && res.data) setCategories(res.data);
    });
  }, [isAuthenticated]);

  const fetchProducts = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);

    const params: Parameters<typeof getAdminProducts>[1] = {
      search: debouncedSearch || undefined,
      page,
      active: viewMode === 'archived' ? 'false' : 'true',
      sort: sortBy,
      limit: 50,
    };

    if (categoryFilter !== 'all') params.category = categoryFilter;
    if (filter === 'veg') params.veg = 'true';
    if (filter === 'non-veg') params.veg = 'false';
    if (filter === 'featured') params.featured = 'true';
    if (filter === 'bestseller') params.bestseller = 'true';
    if (filter === 'unavailable') params.available = 'false';

    const res = await getAdminProducts('', params);
    if (res.success && res.data) {
      setProducts(res.data.products);
      setTotalPages(res.data.pagination.totalPages);
      setTotal(res.data.pagination.total);
    }
    setLoading(false);
  }, [isAuthenticated, debouncedSearch, page, viewMode, filter, categoryFilter, sortBy]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  /* ── Handlers ── */
  const handleArchiveConfirm = async () => {
    if (!toArchive || !isAuthenticated) return;
    setArchiving(true);
    const res = await deleteAdminProduct(toArchive._id, '');
    if (res.success) {
      setProducts(prev => prev.filter(p => p._id !== toArchive._id));
      setTotal(t => t - 1);
      showToast(`"${toArchive.name}" archived`);
    } else {
      showToast(res.error || 'Failed to archive', 'error');
    }
    setArchiving(false);
    setToArchive(null);
  };

  const handleRestore = async (product: AdminProduct) => {
    if (!isAuthenticated) return;
    const res = await restoreAdminProduct(product._id, '');
    if (res.success) {
      setProducts(prev => prev.filter(p => p._id !== product._id));
      setTotal(t => t - 1);
      showToast(`"${product.name}" restored`);
    } else {
      showToast(res.error || 'Failed to restore', 'error');
    }
  };

  const handleFormSuccess = (saved: AdminProduct) => {
    const isNew = !editingProduct;
    setProducts(prev =>
      isNew
        ? [saved, ...prev]
        : prev.map(p => p._id === saved._id ? saved : p)
    );
    if (isNew) setTotal(t => t + 1);
    setShowForm(false);
    setEditingProduct(null);
    showToast(isNew ? `"${saved.name}" created` : `"${saved.name}" updated`);
  };

  const handleEditProduct = (product: AdminProduct) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const FILTERS: { key: FilterMode; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'veg', label: '🥦 Veg' },
    { key: 'non-veg', label: '🍗 Non-Veg' },
    { key: 'featured', label: '⭐ Featured' },
    { key: 'bestseller', label: '🔥 Best Seller' },
    { key: 'unavailable', label: '⛔ Unavailable' },
  ];

  const SORT_OPTIONS = [
    { value: 'displayOrder', label: 'Display Order' },
    { value: 'name', label: 'Name A–Z' },
    { value: 'price-low', label: 'Price ↑' },
    { value: 'price-high', label: 'Price ↓' },
    { value: 'newest', label: 'Newest' },
    { value: 'popular', label: 'Popular' },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading font-bold text-2xl text-forest">Menu Management</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {viewMode === 'active' ? `${total} active item${total !== 1 ? 's' : ''}` : `${total} archived item${total !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex gap-2.5">
          <button onClick={fetchProducts}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-neutral-200 text-sm font-medium text-neutral-500 hover:bg-cream hover:text-neutral-700 transition-all shadow-soft">
            <RefreshIcon className="w-3.5 h-3.5" />Refresh
          </button>
          <button
            onClick={() => { setEditingProduct(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-forest text-white text-sm font-bold hover:bg-forest-light transition-all shadow-soft"
          >
            <PlusIcon />Add Item
          </button>
        </div>
      </div>

      {/* ── Active / Archived tabs ── */}
      <div className="flex gap-1 p-1 bg-neutral-100 rounded-lg w-fit mb-5">
        {([['active', 'Active Menu'], ['archived', 'Archived']] as const).map(([mode, label]) => (
          <button key={mode} onClick={() => { setViewMode(mode); setPage(1); }}
            className={cn(
              'px-4 py-1.5 rounded-md text-sm font-semibold transition-all',
              viewMode === mode ? 'bg-white text-forest shadow-soft' : 'text-neutral-500 hover:text-neutral-700'
            )}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="bg-white rounded-xl border border-neutral-100 shadow-soft p-4 mb-5 space-y-3">
        {/* Search */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search products or categories…"
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-cream border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-colors placeholder:text-neutral-400"
            />
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="px-3 py-2.5 text-sm bg-cream border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-colors text-neutral-600">
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => { setFilter(f.key); setPage(1); }}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                filter === f.key ? 'bg-forest text-white' : 'bg-cream text-neutral-500 hover:bg-cream-dark'
              )}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Category filter */}
        {categories.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setCategoryFilter('all')}
              className={cn('px-3 py-1 rounded-full text-[11px] font-semibold transition-all border',
                categoryFilter === 'all' ? 'bg-gold text-white border-gold' : 'bg-white text-neutral-400 border-neutral-200 hover:border-gold/40')}>
              All Categories
            </button>
            {categories.map(c => (
              <button key={c._id} onClick={() => { setCategoryFilter(c.slug); setPage(1); }}
                className={cn('px-3 py-1 rounded-full text-[11px] font-semibold transition-all border',
                  categoryFilter === c.slug ? 'bg-gold text-white border-gold' : 'bg-white text-neutral-400 border-neutral-200 hover:border-gold/40')}>
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-8 h-8 border-2 border-forest/20 border-t-forest rounded-full animate-spin" />
          <p className="text-sm text-neutral-400">Loading products…</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-5xl mb-4">🍽️</p>
          <p className="text-neutral-500 font-medium">
            {viewMode === 'archived' ? 'No archived products' : 'No products found'}
          </p>
          {viewMode === 'active' && (
            <button
              onClick={() => { setEditingProduct(null); setShowForm(true); }}
              className="mt-4 px-5 py-2.5 bg-forest text-white text-sm font-bold rounded-lg hover:bg-forest-light transition-colors"
            >
              Add your first item
            </button>
          )}
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <motion.div key={`${viewMode}-${page}`} layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((p, i) => (
              <AdminProductCard key={p._id ?? i} product={p} token=''
                onArchive={setToArchive}
                onRestore={handleRestore}
                onEdit={handleEditProduct}
                onUpdate={updated => setProducts(prev => prev.map(x => x._id === updated._id ? updated : x))}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-8">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-neutral-200 bg-white text-neutral-500 hover:bg-cream disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            ← Prev
          </button>
          <span className="text-sm text-neutral-400">Page {page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-neutral-200 bg-white text-neutral-500 hover:bg-cream disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            Next →
          </button>
        </div>
      )}

      {/* ── Modals ── */}
      <AnimatePresence>
        {toArchive && (
          <ArchiveModal product={toArchive}
            onConfirm={handleArchiveConfirm}
            onCancel={() => !archiving && setToArchive(null)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showForm && (
          <ProductForm
            product={editingProduct}
            categories={categories}
            token=''
            onSuccess={handleFormSuccess}
            onClose={() => { setShowForm(false); setEditingProduct(null); }}
            onError={(msg) => showToast(msg, 'error')}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20 }}
            className={cn('fixed bottom-5 right-5 px-4 py-3 rounded-xl text-sm font-semibold shadow-elevated z-50',
              toast.type === 'success' ? 'bg-forest text-white' : 'bg-maroon text-white'
            )}>
            {toast.type === 'success' ? '✓ ' : '✕ '}{toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
