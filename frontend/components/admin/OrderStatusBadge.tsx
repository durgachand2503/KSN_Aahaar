'use client';

import { cn } from '@/lib/utils';

/* ── Order Status ── */
const ORDER_STATUS_MAP: Record<string, { dot: string; bg: string; text: string; label: string }> = {
  placed:              { dot: 'bg-blue-400',    bg: 'bg-blue-50',    text: 'text-blue-700',    label: 'Placed' },
  payment_pending:     { dot: 'bg-amber-400',   bg: 'bg-amber-50',   text: 'text-amber-700',   label: 'Pay Pending' },
  payment_confirmed:   { dot: 'bg-forest',      bg: 'bg-forest/8',   text: 'text-forest',      label: 'Paid' },
  payment_failed:      { dot: 'bg-maroon',      bg: 'bg-maroon/8',   text: 'text-maroon',      label: 'Pay Failed' },
  accepted:            { dot: 'bg-teal-500',    bg: 'bg-teal-50',    text: 'text-teal-700',    label: 'Accepted' },
  preparing:           { dot: 'bg-gold',        bg: 'bg-gold/10',    text: 'text-gold-dark',   label: 'Preparing' },
  ready:               { dot: 'bg-forest',      bg: 'bg-forest/10',  text: 'text-forest',      label: 'Ready' },
  out_for_delivery:    { dot: 'bg-indigo-500',  bg: 'bg-indigo-50',  text: 'text-indigo-700',  label: 'Out for Delivery' },
  delivered:           { dot: 'bg-forest',      bg: 'bg-forest/10',  text: 'text-forest',      label: 'Delivered' },
  cancelled:           { dot: 'bg-maroon',      bg: 'bg-maroon/8',   text: 'text-maroon',      label: 'Cancelled' },
  refund_pending:      { dot: 'bg-amber-500',   bg: 'bg-amber-50',   text: 'text-amber-700',   label: 'Refund Pending' },
  refunded:            { dot: 'bg-neutral-400', bg: 'bg-neutral-100', text: 'text-neutral-600', label: 'Refunded' },
};

export default function OrderStatusBadge({ status, className }: { status: string; className?: string }) {
  const s = ORDER_STATUS_MAP[status] || { dot: 'bg-neutral-400', bg: 'bg-neutral-100', text: 'text-neutral-600', label: status };
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold', s.bg, s.text, className)}>
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', s.dot)} />
      {s.label}
    </span>
  );
}

/* ── Payment Status ── */
const PAYMENT_STATUS_MAP: Record<string, { dot: string; bg: string; text: string; label: string }> = {
  pending:        { dot: 'bg-amber-400',   bg: 'bg-amber-50',   text: 'text-amber-700',   label: 'Pending' },
  captured:       { dot: 'bg-forest',      bg: 'bg-forest/8',   text: 'text-forest',      label: 'Paid' },
  failed:         { dot: 'bg-maroon',      bg: 'bg-maroon/8',   text: 'text-maroon',      label: 'Failed' },
  refund_pending: { dot: 'bg-amber-500',   bg: 'bg-amber-50',   text: 'text-amber-700',   label: 'Refund Pending' },
  refunded:       { dot: 'bg-neutral-400', bg: 'bg-neutral-100', text: 'text-neutral-600', label: 'Refunded' },
};

export function PaymentStatusBadge({ status, className }: { status: string; className?: string }) {
  const s = PAYMENT_STATUS_MAP[status] || { dot: 'bg-neutral-400', bg: 'bg-neutral-100', text: 'text-neutral-600', label: status };
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold', s.bg, s.text, className)}>
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', s.dot)} />
      {s.label}
    </span>
  );
}
