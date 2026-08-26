'use client';

import { cn } from '@/lib/utils';

type BadgeVariant = 'veg' | 'nonveg' | 'featured' | 'offer' | 'status' | 'category';

interface BadgeProps {
  variant: BadgeVariant;
  children?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

const variantStyles: Record<BadgeVariant, string> = {
  veg: 'text-veg bg-veg/10 border-veg/20',
  nonveg: 'text-nonveg bg-nonveg/10 border-nonveg/20',
  featured: 'text-gold-dark bg-gold/10 border-gold/20',
  offer: 'text-maroon bg-maroon/10 border-maroon/20',
  status: 'text-forest bg-forest/10 border-forest/20',
  category: 'text-brown bg-brown/10 border-brown/20',
};

export default function Badge({ variant, children, className, size = 'sm' }: BadgeProps) {
  if (variant === 'veg' && !children) {
    return (
      <span
        className={cn('badge-veg', className)}
        aria-label="Vegetarian"
        title="Vegetarian"
        role="img"
      />
    );
  }

  if (variant === 'nonveg' && !children) {
    return (
      <span
        className={cn('badge-nonveg', className)}
        aria-label="Non-Vegetarian"
        title="Non-Vegetarian"
        role="img"
      />
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium border rounded-full',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs',
        'tracking-wide uppercase',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

/**
 * Veg / Non-Veg indicator with label
 */
export function DietBadge({ isVeg, className }: { isVeg: boolean; className?: string }) {
  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      <Badge variant={isVeg ? 'veg' : 'nonveg'} />
      <span className={cn('text-xs font-medium', isVeg ? 'text-veg' : 'text-nonveg')}>
        {isVeg ? 'Veg' : 'Non-Veg'}
      </span>
    </div>
  );
}
