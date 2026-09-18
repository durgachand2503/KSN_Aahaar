'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import {
  getAdminCategories, createAdminCategory, updateAdminCategory,
  toggleAdminCategory, deleteAdminCategory, uploadProductImage,
  type AdminCategory,
} from '@/lib/api';
import { cn } from '@/lib/utils';
import { getMediaUrl } from '@/lib/constants';

/* ── Icons ── */
const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-4 h-4">
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const EditIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" />
  </svg>
);
const TrashIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);
const UploadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-6 h-6 text-neutral-400">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

/* ── Toggle ── */
function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange}
      className={cn(
        'relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-200',
        checked ? 'bg-forest' : 'bg-neutral-200'
      )}>
      <span className={cn(
        'inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200',
        checked ? 'translate-x-[18px]' : 'translate-x-0.5'
      )} />
    </button>
  );
}

/* ── Category Form Modal ── */
function CategoryModal({
  category, token, onSuccess, onClose, onError
}: {
  category?: AdminCategory | null;
  token: string;
  onSuccess: (c: AdminCategory) => void;
  onClose: () => void;
  onError?: (msg: string) => void;
}) {
  const isEditing = !!category;
  const [name, setName] = useState(category?.name || '');
  const [description, setDescription] = useState(category?.description || '');
  const [image, setImage] = useState(category?.image || '');
  const [displayOrder, setDisplayOrder] = useState(String(category?.displayOrder ?? 0));
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploadError, setUploadError] = useState('');

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) { setUploadError('Image files only'); return; }
    if (file.size > 5 * 1024 * 1024) { setUploadError('Max 5 MB'); return; }
    setUploadError('');
    setUploading(true);
    const res = await uploadProductImage(file, token);
    setUploading(false);
    if (res.success && res.data) setImage(res.data.url);
    else setUploadError(res.error || 'Upload failed');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Category name is required'); return; }
    setSaving(true);
    const data = { name: name.trim(), description: description.trim(), image, displayOrder: Number(displayOrder) || 0 };
    const res = isEditing
      ? await updateAdminCategory(category!._id, data, token)
      : await createAdminCategory(data, token);
    setSaving(false);
    if (res.success && res.data) onSuccess(res.data);
    else {
      const msg = res.error || 'Failed to save';
      setError(msg);
      onError?.(msg);
    }
  };

  const imageUrl = image ? getMediaUrl(image) : null;
  const inputCls = 'w-full px-3.5 py-2.5 text-sm bg-cream border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-colors placeholder:text-neutral-400';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl w-full max-w-md shadow-modal border border-neutral-100 overflow-hidden"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <h2 className="font-heading font-bold text-lg text-forest">{isEditing ? 'Edit Category' : 'Add Category'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-neutral-400 hover:bg-neutral-100 transition-colors">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <p className="text-xs text-maroon bg-maroon/8 px-3 py-2 rounded-lg">{error}</p>}
          
          {/* Image */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wide">Category Image</label>
            {imageUrl ? (
              <div className="relative rounded-xl overflow-hidden h-28 bg-neutral-100 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="Category" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <label className="px-3 py-1.5 bg-white text-neutral-700 text-xs font-semibold rounded-lg cursor-pointer hover:bg-cream">
                    Change
                    <input type="file" accept="image/*" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.target.value = ''; }} />
                  </label>
                </div>
              </div>
            ) : (
              <label className="border-2 border-dashed border-neutral-200 hover:border-gold/50 rounded-xl p-5 flex flex-col items-center gap-1.5 cursor-pointer transition-colors bg-cream/50 hover:bg-cream">
                {uploading ? (
                  <div className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                ) : (
                  <>
                    <UploadIcon />
                    <p className="text-xs text-neutral-500 font-medium">Upload category image</p>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.target.value = ''; }} />
              </label>
            )}
            {uploadError && <p className="text-xs text-maroon mt-1">{uploadError}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wide">Name <span className="text-maroon">*</span></label>
            <input type="text" value={name} onChange={e => { setName(e.target.value); setError(''); }}
              placeholder="e.g., Biryanis, Breads, Desserts"
              className={inputCls} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wide">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Short description of this category…"
              rows={2} className={cn(inputCls, 'resize-none')} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wide">Display Order</label>
            <input type="number" min="0" value={displayOrder} onChange={e => setDisplayOrder(e.target.value)}
              placeholder="0" className={inputCls} />
            <p className="text-[11px] text-neutral-400 mt-1">Lower = appears first</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl bg-forest text-white text-sm font-semibold hover:bg-forest-light disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
              {saving ? 'Saving…' : (isEditing ? 'Save Changes' : 'Create Category')}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════ */
export default function AdminCategoriesPage() {
  const { isAuthenticated } = useAdminAuth();
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null);
  const [toDelete, setToDelete] = useState<AdminCategory | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchCategories = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    const res = await getAdminCategories('');
    if (res.success && res.data) setCategories(res.data);
    setLoading(false);
  }, [isAuthenticated]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const handleToggle = async (cat: AdminCategory) => {
    if (!isAuthenticated) return;
    const res = await toggleAdminCategory(cat._id, '');
    if (res.success && res.data) {
      setCategories(prev => prev.map(c => c._id === cat._id ? res.data! : c));
      showToast(`"${cat.name}" ${res.data.isActive ? 'activated' : 'deactivated'}`);
    }
  };

  const handleDelete = async () => {
    if (!toDelete || !isAuthenticated) return;
    setDeleting(true);
    const res = await deleteAdminCategory(toDelete._id, '');
    if (res.success) {
      setCategories(prev => prev.filter(c => c._id !== toDelete._id));
      showToast(`"${toDelete.name}" deleted`);
    } else {
      showToast(res.error || 'Failed to delete', 'error');
    }
    setDeleting(false);
    setToDelete(null);
  };

  const handleFormSuccess = (saved: AdminCategory) => {
    const isNew = !editingCategory;
    setCategories(prev =>
      isNew ? [...prev, saved] : prev.map(c => c._id === saved._id ? saved : c)
    );
    setShowForm(false);
    setEditingCategory(null);
    showToast(isNew ? `"${saved.name}" created` : `"${saved.name}" updated`);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading font-bold text-2xl text-forest">Categories</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{categories.length} total categories</p>
        </div>
        <button onClick={() => { setEditingCategory(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-forest text-white text-sm font-bold hover:bg-forest-light transition-all shadow-soft">
          <PlusIcon />Add Category
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-7 h-7 border-2 border-forest/20 border-t-forest rounded-full animate-spin" />
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-5xl mb-4">🏷️</p>
          <p className="text-neutral-500 font-medium">No categories yet</p>
          <button onClick={() => setShowForm(true)}
            className="mt-4 px-5 py-2.5 bg-forest text-white text-sm font-bold rounded-lg hover:bg-forest-light transition-colors">
            Add your first category
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-neutral-100 shadow-soft overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wider px-4 py-3">Category</th>
                <th className="text-center text-[11px] font-semibold text-neutral-400 uppercase tracking-wider px-4 py-3">Items</th>
                <th className="text-center text-[11px] font-semibold text-neutral-400 uppercase tracking-wider px-4 py-3">Order</th>
                <th className="text-center text-[11px] font-semibold text-neutral-400 uppercase tracking-wider px-4 py-3">Active</th>
                <th className="text-right text-[11px] font-semibold text-neutral-400 uppercase tracking-wider px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat, i) => {
                const imageUrl = cat.image ? getMediaUrl(cat.image) : null;
                return (
                  <motion.tr key={cat._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className={cn('border-b border-neutral-50 hover:bg-cream/40 transition-colors', !cat.isActive && 'opacity-50')}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={imageUrl} alt={cat.name} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-cream flex items-center justify-center flex-shrink-0">
                            <span className="text-lg">🏷️</span>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-neutral-800">{cat.name}</p>
                          <p className="text-[11px] text-neutral-400 truncate max-w-xs">{cat.description || cat.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm text-neutral-600 font-medium">{cat.itemCount}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm text-neutral-500">{cat.displayOrder}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Toggle checked={cat.isActive} onChange={() => handleToggle(cat)} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => { setEditingCategory(cat); setShowForm(true); }}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-forest hover:bg-forest/10 transition-all">
                          <EditIcon className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setToDelete(cat)} disabled={cat.itemCount > 0}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-maroon hover:bg-maroon/8 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                          title={cat.itemCount > 0 ? `Cannot delete: ${cat.itemCount} product(s) in this category` : 'Delete category'}>
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {toDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
            onClick={() => !deleting && setToDelete(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-modal"
              onClick={e => e.stopPropagation()}>
              <h3 className="font-heading font-bold text-lg text-center text-neutral-800 mb-2">Delete Category?</h3>
              <p className="text-sm text-neutral-500 text-center mb-6">
                <span className="font-semibold text-neutral-700">{toDelete.name}</span> will be permanently deleted.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setToDelete(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors">
                  Cancel
                </button>
                <button onClick={handleDelete} disabled={deleting}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-maroon text-white text-sm font-semibold hover:bg-maroon-dark disabled:opacity-60 transition-colors">
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <CategoryModal
            category={editingCategory}
            token=''
            onSuccess={handleFormSuccess}
            onClose={() => { setShowForm(false); setEditingCategory(null); }}
            onError={(msg) => showToast(msg, 'error')}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className={cn('fixed bottom-5 right-5 px-4 py-3 rounded-xl text-sm font-semibold shadow-elevated z-50',
              toast.type === 'success' ? 'bg-forest text-white' : 'bg-maroon text-white')}>
            {toast.type === 'success' ? '✓ ' : '✕ '}{toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
