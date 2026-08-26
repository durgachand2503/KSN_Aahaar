'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export default function Skeleton({ className, variant = 'rectangular', width, height }: SkeletonProps) {
  return (
    <div
      className={cn(
        'skeleton',
        variant === 'circular' && 'rounded-full',
        variant === 'text' && 'rounded h-4',
        className
      )}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

/**
 * Product card skeleton for loading states
 */
export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-soft" aria-hidden="true">
      <Skeleton className="w-full aspect-[4/3]" />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4 rounded" />
          <Skeleton className="w-16 h-3" variant="text" />
        </div>
        <Skeleton className="w-3/4 h-5" variant="text" />
        <Skeleton className="w-full h-3" variant="text" />
        <Skeleton className="w-2/3 h-3" variant="text" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="w-16 h-6" variant="text" />
          <Skeleton className="w-24 h-9 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/**
 * Menu page skeleton
 */
export function MenuSkeleton() {
  return (
    <div className="space-y-8">
      {/* Category filter skeleton */}
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="w-24 h-9 rounded-full flex-shrink-0" />
        ))}
      </div>
      {/* Product grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/**
 * Order card skeleton
 */
export function OrderSkeleton() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-soft space-y-4" aria-hidden="true">
      <div className="flex justify-between">
        <Skeleton className="w-28 h-5" variant="text" />
        <Skeleton className="w-20 h-5 rounded-full" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="w-full h-4" variant="text" />
        ))}
      </div>
      <div className="flex justify-between pt-2">
        <Skeleton className="w-20 h-6" variant="text" />
        <Skeleton className="w-28 h-9 rounded-lg" />
      </div>
    </div>
  );
}
