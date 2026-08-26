'use client';

import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  placed: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Placed' },
  payment_pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pay Pending' },
  payment_confirmed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Paid' },
  payment_failed: { bg: 'bg-red-100', text: 'text-red-700', label: 'Pay Failed' },
  accepted: { bg: 'bg-teal-100', text: 'text-teal-700', label: 'Accepted' },
  preparing: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Preparing' },
  ready: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Ready' },
  out_for_delivery: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Out for Delivery' },
  delivered: { bg: 'bg-green-100', text: 'text-green-800', label: 'Delivered' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' },
  refund_pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Refund Pending' },
  refunded: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Refunded' },
};

export default function OrderStatusBadge({ status, className }: { status: string; className?: string }) {
  const style = STATUS_STYLES[status] || { bg: 'bg-neutral-100', text: 'text-neutral-600', label: status };

  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide',
      style.bg,
      style.text,
      className
    )}>
      {style.label}
    </span>
  );
}

export function PaymentStatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
    captured: { bg: 'bg-green-100', text: 'text-green-700', label: 'Paid' },
    failed: { bg: 'bg-red-100', text: 'text-red-700', label: 'Failed' },
    refund_pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Refund Pending' },
    refunded: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Refunded' },
  };

  const style = styles[status] || { bg: 'bg-neutral-100', text: 'text-neutral-600', label: status };

  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide',
      style.bg,
      style.text,
    )}>
      {style.label}
    </span>
  );
}
