'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AdminProduct, AdminCategory,
  createAdminProduct, updateAdminProduct,
  uploadProductImage, deleteProductImage,
} from '@/lib/api';
import { formatPrice, cn } from '@/lib/utils';
import { getMediaUrl } from '@/lib/constants';

/* ── Types ── */
interface Variant {
  _id?: string;
  name: string;
  price: number | string;
  isAvailable: boolean;
}

interface FormData {
  name: string;
  shortDescription: string;
  description: string;
  categoryId: string;
  isVeg: boolean;
  servingInfo: string;
  ingredients: string;    // comma-separated
  displayOrder: number | string;
  image: string;
  isAvailable: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewItem: boolean;
  variants: Variant[];
}

interface ProductFormProps {
  product?: AdminProduct | null;
  categories: AdminCategory[];
  token: string;
  onSuccess: (product: AdminProduct) => void;
  onClose: () => void;
  onError?: (message: string) => void;
}

/* ── Icons ── */
const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const TrashIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);
const UploadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-neutral-400">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);
const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

/* ── Toggle component ── */
function Toggle({ checked, onChange, label, colorOn = 'bg-forest' }: {
  checked: boolean; onChange: () => void; label: string; colorOn?: string;
}) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer select-none">
      <span className="text-sm text-neutral-700">{label}</span>
      <button
        type="button"
        onClick={onChange}
        className={cn(
          'relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50',
          checked ? colorOn : 'bg-neutral-200'
        )}
        aria-pressed={checked}
      >
        <span className={cn(
          'inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200',
          checked ? 'translate-x-[18px]' : 'translate-x-0.5'
        )} />
      </button>
    </label>
  );
}

/* ── Field label wrapper (module-level — must NOT be defined inside a component) ── */
function Field({ label, error, required, children }: {
  label: string; error?: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wide">
        {label}{required && <span className="text-maroon ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-maroon mt-1">{error}</p>}
    </div>
  );
}

function inputCls(err?: string) {
  return cn(
    'w-full px-3.5 py-2.5 text-sm bg-cream border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-colors placeholder:text-neutral-400',
    err ? 'border-maroon/50 bg-maroon/5' : 'border-neutral-200'
  );
}

/* ── Main Form ── */
export default function ProductForm({ product, categories, token, onSuccess, onClose, onError }: ProductFormProps) {
  const isEditing = !!product;

  const initialData: FormData = {
    name: product?.name || '',
    shortDescription: product?.shortDescription || '',
    description: product?.description || '',
    categoryId: product?.category || (categories[0]?._id || ''),
    isVeg: product?.isVeg ?? true,
    servingInfo: product?.servingInfo || '',
    ingredients: product?.ingredients?.join(', ') || '',
    displayOrder: product?.displayOrder ?? 0,
    image: product?.image || '',
    isAvailable: product?.isAvailable ?? true,
    isFeatured: product?.isFeatured ?? false,
    isBestSeller: product?.isBestSeller ?? false,
    isNewItem: product?.isNewItem ?? false,
    variants: product?.variants?.map(v => ({ _id: v._id, name: v.name, price: v.price, isAvailable: v.isAvailable })) || [
      { name: 'Regular', price: '', isAvailable: true }
    ],
  };

  const [form, setForm] = useState<FormData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  /* ── Field helpers ── */
  const setField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: '' }));
  };

  /* ── Image upload ── */
  const handleImageUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) { setUploadError('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { setUploadError('Image must be under 5 MB'); return; }
    setUploadError('');
    setUploading(true);
    const res = await uploadProductImage(file, token);
    setUploading(false);
    if (res.success && res.data) {
      setField('image', res.data.url);
    } else {
      setUploadError(res.error || 'Upload failed');
    }
  }, [token]);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleImageUpload(file);
  }, [handleImageUpload]);

  const handleRemoveImage = async () => {
    if (!form.image) return;
    const filename = form.image.split('/').pop();
    if (filename) deleteProductImage(filename, token);
    setField('image', '');
  };

  /* ── Variants ── */
  const addVariant = () => setForm(prev => ({
    ...prev, variants: [...prev.variants, { name: '', price: '', isAvailable: true }]
  }));

  const updateVariant = (i: number, key: keyof Variant, value: string | number | boolean) => {
    setForm(prev => ({
      ...prev,
      variants: prev.variants.map((v, idx) => idx === i ? { ...v, [key]: value } : v)
    }));
  };

  const removeVariant = (i: number) => {
    if (form.variants.length <= 1) return;
    setForm(prev => ({ ...prev, variants: prev.variants.filter((_, idx) => idx !== i) }));
  };

  /* ── Validation ── */
  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Product name is required';
    if (!form.shortDescription.trim()) e.shortDescription = 'Short description is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (!form.categoryId) e.categoryId = 'Category is required';
    if (form.variants.length === 0) e.variants = 'At least one variant is required';
    form.variants.forEach((v, i) => {
      if (!v.name.trim()) e[`variant_${i}_name`] = 'Variant name is required';
      if (!v.price || Number(v.price) < 0) e[`variant_${i}_price`] = 'Valid price is required';
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      shortDescription: form.shortDescription.trim(),
      description: form.description.trim(),
      categoryId: form.categoryId,
      isVeg: form.isVeg,
      servingInfo: form.servingInfo.trim(),
      ingredients: form.ingredients.split(',').map(s => s.trim()).filter(Boolean),
      displayOrder: Number(form.displayOrder) || 0,
      image: form.image,
      isAvailable: form.isAvailable,
      isFeatured: form.isFeatured,
      isBestSeller: form.isBestSeller,
      isNewItem: form.isNewItem,
      variants: form.variants.map(v => ({
        ...(v._id ? { _id: v._id } : {}),
        name: v.name.trim(),
        price: Number(v.price),
        isAvailable: v.isAvailable,
      })),
    };

    const res = isEditing
      ? await updateAdminProduct(product!._id, payload, token)
      : await createAdminProduct(payload as Parameters<typeof createAdminProduct>[0], token);

    setSaving(false);
    if (res.success && res.data) {
      onSuccess(res.data);
    } else {
      const msg = res.error || 'Failed to save product';
      setErrors({ _server: msg });
      onError?.(msg);
    }
  };

  /* ── Image preview URL ── */
  const imagePreview = form.image ? getMediaUrl(form.image) : null;

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Drawer */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        onClick={e => e.stopPropagation()}
        className="absolute right-0 top-0 bottom-0 w-full max-w-xl bg-white shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex-shrink-0">
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-white">
            <div>
              <h2 className="font-heading font-bold text-lg text-forest">
                {isEditing ? 'Edit Product' : 'Add New Product'}
              </h2>
              {isEditing && <p className="text-xs text-neutral-400 mt-0.5 truncate max-w-xs">{product!.name}</p>}
            </div>
            <button onClick={onClose} className="p-2 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors">
              <CloseIcon />
            </button>
          </div>
          {/* Server error — always visible, NOT inside scroll area */}
          <AnimatePresence>
            {errors._server && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="mx-4 mt-3 mb-1 px-4 py-3 bg-maroon/8 border border-maroon/25 rounded-xl text-sm text-maroon font-medium flex items-start gap-2"
              >
                <span className="mt-0.5 flex-shrink-0">✕</span>
                <span>{errors._server}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* REMOVED: server error was here — now shown above the scroll area in the header */}

          {/* ── Image Upload ── */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wide">Product Photo</label>
            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden aspect-[16/9] bg-neutral-100 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Product preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="px-3 py-1.5 bg-white text-neutral-700 text-xs font-semibold rounded-lg hover:bg-cream transition-colors">
                    Change
                  </button>
                  <button type="button" onClick={handleRemoveImage}
                    className="px-3 py-1.5 bg-maroon text-white text-xs font-semibold rounded-lg hover:bg-maroon-dark transition-colors">
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDrop={handleFileDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-neutral-200 hover:border-gold/50 rounded-xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-cream/50 hover:bg-cream"
              >
                {uploading ? (
                  <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                ) : (
                  <>
                    <UploadIcon />
                    <p className="text-sm text-neutral-500 font-medium">Drop image here or <span className="text-gold font-semibold">click to browse</span></p>
                    <p className="text-xs text-neutral-400">JPG, PNG, WebP — max 5 MB</p>
                  </>
                )}
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.target.value = ''; }} />
            {uploadError && <p className="text-xs text-maroon mt-1">{uploadError}</p>}
          </div>

          {/* ── Basic Info ── */}
          <Field label="Product Name" required error={errors.name}>
            <input
              type="text" value={form.name} onChange={e => setField('name', e.target.value)}
              placeholder="e.g., Chicken Dum Biriyani"
              className={inputCls(errors.name)}
            />
          </Field>

          <Field label="Category" required error={errors.categoryId}>
            <select value={form.categoryId} onChange={e => setField('categoryId', e.target.value)} className={inputCls(errors.categoryId)}>
              {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </Field>

          {/* Food Type */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wide">Food Type</label>
            <div className="flex gap-3">
              {[{ label: '🟢 Vegetarian', value: true }, { label: '🔴 Non-Vegetarian', value: false }].map(opt => (
                <button key={String(opt.value)} type="button"
                  onClick={() => setField('isVeg', opt.value)}
                  className={cn(
                    'flex-1 py-2.5 rounded-lg border text-sm font-semibold transition-all',
                    form.isVeg === opt.value
                      ? 'bg-forest text-white border-forest'
                      : 'bg-cream border-neutral-200 text-neutral-600 hover:border-forest/40'
                  )}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <Field label="Short Description" required error={errors.shortDescription}>
            <textarea value={form.shortDescription} onChange={e => setField('shortDescription', e.target.value)}
              placeholder="One-line description shown in product cards…"
              rows={2} className={cn(inputCls(errors.shortDescription), 'resize-none')} />
          </Field>

          <Field label="Full Description" required error={errors.description}>
            <textarea value={form.description} onChange={e => setField('description', e.target.value)}
              placeholder="Detailed product description…"
              rows={4} className={cn(inputCls(errors.description), 'resize-none')} />
          </Field>

          <Field label="Serving Info">
            <input type="text" value={form.servingInfo} onChange={e => setField('servingInfo', e.target.value)}
              placeholder="e.g., Single serves 1, Family Pack serves 3–4"
              className={inputCls()} />
          </Field>

          <Field label="Ingredients" >
            <input type="text" value={form.ingredients} onChange={e => setField('ingredients', e.target.value)}
              placeholder="Comma-separated: Basmati Rice, Chicken, Yogurt…"
              className={inputCls()} />
            <p className="text-[11px] text-neutral-400 mt-1">Separate ingredients with commas</p>
          </Field>

          {/* ── Variants ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-neutral-700 uppercase tracking-wide">
                Variants & Prices<span className="text-maroon ml-0.5">*</span>
              </label>
              <button type="button" onClick={addVariant}
                className="flex items-center gap-1 text-xs font-semibold text-gold hover:text-gold-dark transition-colors px-2 py-1 rounded-lg hover:bg-gold/10">
                <PlusIcon />Add Variant
              </button>
            </div>
            {errors.variants && <p className="text-xs text-maroon mb-2">{errors.variants}</p>}
            <div className="space-y-2">
              {form.variants.map((variant, i) => (
                <div key={i} className="flex gap-2 items-start bg-cream rounded-xl p-3 border border-neutral-100">
                  <div className="flex-1 min-w-0 space-y-2">
                    <input
                      type="text" value={variant.name}
                      onChange={e => updateVariant(i, 'name', e.target.value)}
                      placeholder="Size name (e.g., Regular, Family Pack)"
                      className={cn(inputCls(errors[`variant_${i}_name`]), 'text-sm')}
                    />
                    {errors[`variant_${i}_name`] && <p className="text-xs text-maroon">{errors[`variant_${i}_name`]}</p>}
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400 font-medium">₹</span>
                          <input
                            type="number" min="0" step="0.01" value={variant.price}
                            onChange={e => updateVariant(i, 'price', e.target.value)}
                            placeholder="0"
                            className={cn(inputCls(errors[`variant_${i}_price`]), 'pl-7 text-sm')}
                          />
                        </div>
                        {errors[`variant_${i}_price`] && <p className="text-xs text-maroon mt-0.5">{errors[`variant_${i}_price`]}</p>}
                      </div>
                      <button type="button"
                        onClick={() => updateVariant(i, 'isAvailable', !variant.isAvailable)}
                        className={cn(
                          'flex-shrink-0 px-2.5 py-2 rounded-lg text-xs font-semibold border transition-all',
                          variant.isAvailable ? 'bg-forest/10 text-forest border-forest/20' : 'bg-neutral-100 text-neutral-400 border-neutral-200'
                        )}>
                        {variant.isAvailable ? 'In Stock' : 'OOS'}
                      </button>
                    </div>
                  </div>
                  <button type="button" onClick={() => removeVariant(i)} disabled={form.variants.length <= 1}
                    className="mt-1 p-1.5 rounded-lg text-neutral-300 hover:text-maroon hover:bg-maroon/8 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            {form.variants.some(v => v.price) && (
              <p className="text-xs text-neutral-400 mt-2">
                Price range: {formatPrice(Math.min(...form.variants.map(v => Number(v.price) || 0).filter(Boolean)))}
                {' – '}{formatPrice(Math.max(...form.variants.map(v => Number(v.price) || 0)))}
              </p>
            )}
          </div>

          {/* ── Status Toggles ── */}
          <div className="bg-cream rounded-xl p-4 border border-neutral-100 space-y-3">
            <p className="text-xs font-semibold text-neutral-700 uppercase tracking-wide mb-1">Status & Badges</p>
            <Toggle checked={form.isAvailable} onChange={() => setField('isAvailable', !form.isAvailable)} label="Available for ordering" colorOn="bg-forest" />
            <Toggle checked={form.isFeatured} onChange={() => setField('isFeatured', !form.isFeatured)} label="⭐ Featured on homepage" colorOn="bg-amber-500" />
            <Toggle checked={form.isBestSeller} onChange={() => setField('isBestSeller', !form.isBestSeller)} label="🔥 Best Seller badge" colorOn="bg-gold" />
            <Toggle checked={form.isNewItem} onChange={() => setField('isNewItem', !form.isNewItem)} label="🆕 New item badge" colorOn="bg-sky-500" />
          </div>

          {/* ── Display Order ── */}
          <Field label="Display Order">
            <input type="number" min="0" step="1" value={form.displayOrder}
              onChange={e => setField('displayOrder', e.target.value)}
              placeholder="0"
              className={inputCls()}
            />
            <p className="text-[11px] text-neutral-400 mt-1">Lower number appears first in the menu</p>
          </Field>

        </form>

        {/* Footer actions */}
        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 bg-white flex-shrink-0">
          <button type="button" onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors">
            Cancel
          </button>
          <button
            type="submit" form="product-form" onClick={handleSubmit}
            disabled={saving || uploading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-forest text-white text-sm font-semibold hover:bg-forest-light disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {saving ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
            ) : (
              isEditing ? 'Save Changes' : 'Create Product'
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
