'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import {
  getAdminCoupons, createAdminCoupon, toggleAdminCoupon, deleteAdminCoupon,
  type AdminCoupon, type CreateCouponPayload,
} from '@/lib/api';
import { formatPrice, formatDate, cn } from '@/lib/utils';

const EMPTY_FORM: {
  code: string; discountType: 'percentage' | 'fixed';
  discountValue: string; minOrderAmount: string; maxDiscount: string;
  expiryDate: string; usageLimit: string; description: string;
} = {
  code: '', discountType: 'percentage',
  discountValue: '', minOrderAmount: '0', maxDiscount: '',
  expiryDate: '', usageLimit: '100', description: '',
};

/* ── Icons ── */
const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M5 12h14M12 5v14" />
  </svg>
);
const TrashIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);
const TagIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.42 0l8.58-8.58a1 1 0 0 0 0-1.42L12 2Z" /><path d="M7 7h.01" />
  </svg>
);
const PowerIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18.36 6.64a9 9 0 1 1-12.73 0" /><line x1="12" y1="2" x2="12" y2="12" />
  </svg>
);

/* ── Delete Confirm Modal ── */
function DeleteCouponModal({ coupon, onConfirm, onCancel, deleting }: {
  coupon: AdminCoupon; onConfirm: () => void; onCancel: () => void; deleting: boolean;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 backdrop-blur-sm"
      onClick={onCancel}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-modal border border-neutral-100"
        onClick={e => e.stopPropagation()}>
        <div className="w-11 h-11 rounded-full bg-maroon/8 flex items-center justify-center mx-auto mb-4">
          <TrashIcon className="w-5 h-5 text-maroon" />
        </div>
        <h3 className="font-heading font-bold text-lg text-center text-neutral-800 mb-1">Delete Coupon?</h3>
        <p className="text-sm text-neutral-500 text-center mb-1">
          Coupon <span className="font-mono font-bold text-forest tracking-widest">{coupon.code}</span> will be
        </p>
        <p className="text-xs text-neutral-400 text-center mb-6">permanently deleted and can&apos;t be recovered.</p>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={deleting}
            className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={deleting}
            className="flex-1 px-4 py-2.5 rounded-xl bg-maroon text-white text-sm font-semibold hover:bg-maroon-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {deleting && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Field wrapper ── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls = 'w-full text-neutral-800 placeholder:text-neutral-300 px-3.5 py-2.5 rounded-xl text-sm border border-neutral-200 bg-cream focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all';

/* ── Status helpers ── */
function couponStatus(c: AdminCoupon) {
  const expired = new Date(c.expiryDate) < new Date();
  const exhausted = c.usedCount >= c.usageLimit;
  if (!c.isActive) return { label: 'Inactive', cls: 'bg-neutral-100 text-neutral-500 border-neutral-200', bar: 'bg-neutral-200' };
  if (expired)    return { label: 'Expired',  cls: 'bg-maroon/8 text-maroon border-maroon/15',           bar: 'bg-maroon'    };
  if (exhausted)  return { label: 'Exhausted',cls: 'bg-amber-50 text-amber-700 border-amber-200',        bar: 'bg-amber-400' };
  return           { label: 'Active',  cls: 'bg-forest/8 text-forest border-forest/15',                  bar: 'bg-forest'    };
}

/* ── Coupon Card ── */
function CouponCard({
  coupon, onDelete, onToggle, toggling,
}: {
  coupon: AdminCoupon;
  onDelete: () => void;
  onToggle: () => void;
  toggling: boolean;
}) {
  const st = couponStatus(coupon);
  const pct = coupon.usageLimit > 0
    ? Math.min(100, Math.round((coupon.usedCount / coupon.usageLimit) * 100))
    : 100;
  const barColor = pct >= 90 ? 'bg-maroon' : pct >= 60 ? 'bg-amber-400' : 'bg-forest';

  return (
    <motion.div layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
      className="bg-white rounded-xl border border-neutral-100 shadow-soft hover:shadow-card hover:-translate-y-0.5 transition-all group">

      {/* Color strip */}
      <div className={cn('h-0.5 rounded-t-xl', st.bar)} />

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <TagIcon className="w-3.5 h-3.5 text-gold-dark flex-shrink-0" />
              <span className="font-mono font-bold text-base text-forest-dark tracking-widest truncate">{coupon.code}</span>
            </div>
            <p className="text-neutral-400 text-[11px] truncate pl-5">{coupon.description || 'No description'}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold border', st.cls)}>
              {st.label}
            </span>
            {/* Toggle active */}
            <button
              onClick={onToggle} disabled={toggling}
              title={coupon.isActive ? 'Deactivate coupon' : 'Activate coupon'}
              className={cn(
                'opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all disabled:opacity-40',
                coupon.isActive
                  ? 'text-forest hover:bg-forest/10'
                  : 'text-neutral-400 hover:bg-neutral-100'
              )}>
              <PowerIcon className="w-3.5 h-3.5" />
            </button>
            <button onClick={onDelete}
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-neutral-300 hover:text-maroon hover:bg-maroon/8 transition-all">
              <TrashIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="rounded-lg px-2.5 py-2 bg-gold/8 border border-gold/15 text-center">
            <p className="text-gold-dark font-bold text-base leading-none">
              {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
            </p>
            <p className="text-neutral-400 text-[10px] mt-0.5">Off</p>
          </div>
          <div className="rounded-lg px-2.5 py-2 bg-cream border border-neutral-100 text-center">
            <p className="text-neutral-700 font-semibold text-sm leading-none">{formatPrice(coupon.minOrderAmount)}</p>
            <p className="text-neutral-400 text-[10px] mt-0.5">Min</p>
          </div>
          <div className="rounded-lg px-2.5 py-2 bg-cream border border-neutral-100 text-center">
            <p className="text-neutral-700 font-semibold text-sm leading-none">{coupon.usedCount}/{coupon.usageLimit}</p>
            <p className="text-neutral-400 text-[10px] mt-0.5">Used</p>
          </div>
        </div>

        {/* Usage bar */}
        <div className="h-1 rounded-full bg-neutral-100 overflow-hidden mb-2">
          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7, ease: 'easeOut' }}
            className={cn('h-full rounded-full', barColor)} />
        </div>

        {/* Expiry */}
        <p className="text-neutral-400 text-[11px]">
          Expires{' '}
          <span className={cn('font-semibold', new Date(coupon.expiryDate) < new Date() ? 'text-maroon' : 'text-neutral-600')}>
            {formatDate(coupon.expiryDate)}
          </span>
          {coupon.maxDiscount ? ` · Max ₹${coupon.maxDiscount} off` : ''}
        </p>
      </div>
    </motion.div>
  );
}

/* ── Page ── */
export default function AdminCouponsPage() {
  const { isAuthenticated } = useAdminAuth();
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<AdminCoupon | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchCoupons = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    const res = await getAdminCoupons('');
    if (res.success && res.data) {
      setCoupons(res.data);
    } else {
      setError(res.error || 'Failed to load coupons');
    }
    setLoading(false);
  }, [isAuthenticated]);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.discountValue || parseFloat(form.discountValue) <= 0) {
      showToast('Discount value must be greater than 0', 'error');
      return;
    }
    setSubmitting(true);
    const payload: CreateCouponPayload = {
      code: form.code.toUpperCase().trim(),
      discountType: form.discountType,
      discountValue: parseFloat(form.discountValue),
      minOrderAmount: parseFloat(form.minOrderAmount) || 0,
      maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : undefined,
      expiryDate: form.expiryDate,
      usageLimit: parseInt(form.usageLimit) || 100,
      description: form.description,
    };
    const res = await createAdminCoupon(payload, '');
    if (res.success && res.data) {
      showToast(`Coupon "${payload.code}" created`);
      setShowForm(false);
      setForm(EMPTY_FORM);
      // Optimistically prepend the new coupon
      setCoupons(prev => [res.data!, ...prev]);
    } else {
      showToast(res.error || 'Failed to create coupon', 'error');
    }
    setSubmitting(false);
  };

  const handleToggle = async (coupon: AdminCoupon) => {
    setTogglingId(coupon._id || coupon.id);
    const res = await toggleAdminCoupon(coupon._id || coupon.id, '');
    if (res.success && res.data) {
      setCoupons(prev => prev.map(c => (c._id || c.id) === (coupon._id || coupon.id) ? res.data! : c));
      showToast(`"${coupon.code}" ${res.data.isActive ? 'activated' : 'deactivated'}`);
    } else {
      showToast(res.error || 'Failed to toggle coupon', 'error');
    }
    setTogglingId(null);
  };

  const handleDeleteConfirm = async () => {
    if (!toDelete) return;
    setDeleting(true);
    const id = toDelete._id || toDelete.id;
    const res = await deleteAdminCoupon(id, '');
    if (res.success) {
      setCoupons(prev => prev.filter(c => (c._id || c.id) !== id));
      showToast(`"${toDelete.code}" deleted`);
    } else {
      showToast(res.error || 'Failed to delete', 'error');
    }
    setDeleting(false);
    setToDelete(null);
  };

  const activeCoupons = coupons.filter(
    c => c.isActive && new Date(c.expiryDate) > new Date() && c.usedCount < c.usageLimit
  );

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading font-bold text-2xl text-forest">Coupons</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            <span className="text-forest font-semibold">{activeCoupons.length} active</span>
            {' · '}{coupons.length} total
          </p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-soft',
            showForm
              ? 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              : 'bg-forest text-white hover:bg-forest-light'
          )}
        >
          <PlusIcon className={cn('w-4 h-4 transition-transform duration-200', showForm && 'rotate-45')} />
          {showForm ? 'Cancel' : 'New Coupon'}
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Total',   value: coupons.length,                                                          cls: 'text-neutral-700', border: 'border-neutral-100'  },
          { label: 'Active',  value: activeCoupons.length,                                                    cls: 'text-forest',      border: 'border-forest/15'   },
          { label: 'Expired', value: coupons.filter(c => new Date(c.expiryDate) < new Date()).length,         cls: 'text-maroon',      border: 'border-maroon/15'   },
        ].map(s => (
          <div key={s.label} className={cn('bg-white rounded-xl p-4 border shadow-soft', s.border)}>
            <p className={cn('font-bold text-2xl font-heading', s.cls)}>{s.value}</p>
            <p className="text-neutral-400 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreate}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-xl border border-gold/25 shadow-soft p-5 mb-6">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-100">
                <TagIcon className="w-4 h-4 text-gold-dark" />
                <h3 className="font-heading font-bold text-neutral-800">Create New Coupon</h3>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Code *">
                  <input type="text" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))}
                    placeholder="e.g. SAVE20" required className={inputCls} />
                </Field>
                <Field label="Discount Type *">
                  <select value={form.discountType} onChange={e => setForm(p => ({ ...p, discountType: e.target.value as 'percentage' | 'fixed' }))} className={inputCls}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </Field>
                <Field label={`Value * (${form.discountType === 'percentage' ? '%' : '₹'})`}>
                  <input type="number" value={form.discountValue} onChange={e => setForm(p => ({ ...p, discountValue: e.target.value }))}
                    placeholder={form.discountType === 'percentage' ? '20' : '50'} required min={1} className={inputCls} />
                </Field>
                <Field label="Min. Order (₹)">
                  <input type="number" value={form.minOrderAmount} onChange={e => setForm(p => ({ ...p, minOrderAmount: e.target.value }))}
                    placeholder="199" min={0} className={inputCls} />
                </Field>
                {form.discountType === 'percentage' && (
                  <Field label="Max. Discount Cap (₹)">
                    <input type="number" value={form.maxDiscount} onChange={e => setForm(p => ({ ...p, maxDiscount: e.target.value }))}
                      placeholder="100" min={0} className={inputCls} />
                  </Field>
                )}
                <Field label="Expiry Date *">
                  <input type="date" value={form.expiryDate} onChange={e => setForm(p => ({ ...p, expiryDate: e.target.value }))}
                    required min={new Date().toISOString().split('T')[0]} className={inputCls} />
                </Field>
                <Field label="Usage Limit">
                  <input type="number" value={form.usageLimit} onChange={e => setForm(p => ({ ...p, usageLimit: e.target.value }))}
                    placeholder="100" min={1} className={inputCls} />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Description">
                    <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                      placeholder="e.g. 20% off on orders above ₹199" className={inputCls} />
                  </Field>
                </div>
              </div>
              <div className="flex gap-3 mt-5 pt-4 border-t border-neutral-100">
                <button type="submit" disabled={submitting}
                  className="px-6 py-2.5 rounded-lg bg-forest text-white text-sm font-semibold hover:bg-forest-light transition-colors disabled:opacity-50 shadow-soft">
                  {submitting ? 'Creating…' : '✓ Create Coupon'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 rounded-lg text-sm font-semibold text-neutral-500 hover:bg-cream transition-colors border border-neutral-200">
                  Cancel
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Coupons Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-7 h-7 border-2 border-forest/20 border-t-forest rounded-full animate-spin" />
          <p className="text-sm text-neutral-400">Loading coupons…</p>
        </div>
      ) : error ? (
        <div className="text-center py-24">
          <p className="text-4xl mb-4">⚠️</p>
          <p className="text-neutral-600 font-medium text-sm mb-3">{error}</p>
          <button onClick={fetchCoupons} className="text-sm text-forest font-semibold hover:underline">Try again</button>
        </div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-5xl mb-4">🏷️</p>
          <p className="text-neutral-500 font-medium">No coupons yet</p>
          <p className="text-neutral-400 text-sm mt-1">Create your first coupon to offer discounts.</p>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {coupons.map(c => (
              <CouponCard
                key={c._id || c.id}
                coupon={c}
                onDelete={() => setToDelete(c)}
                onToggle={() => handleToggle(c)}
                toggling={togglingId === (c._id || c.id)}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Delete Modal */}
      <AnimatePresence>
        {toDelete && (
          <DeleteCouponModal
            coupon={toDelete}
            deleting={deleting}
            onConfirm={handleDeleteConfirm}
            onCancel={() => !deleting && setToDelete(null)}
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
