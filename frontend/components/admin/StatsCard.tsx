'use client';

import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: 'forest' | 'gold' | 'maroon' | 'blue';
}

const colorMap = {
  forest: {
    card: 'border-forest/15',
    icon: 'bg-forest/8 text-forest',
    value: 'text-forest',
    accent: 'bg-forest',
  },
  gold: {
    card: 'border-gold/20',
    icon: 'bg-gold/10 text-gold-dark',
    value: 'text-gold-dark',
    accent: 'bg-gold',
  },
  maroon: {
    card: 'border-maroon/15',
    icon: 'bg-maroon/8 text-maroon',
    value: 'text-maroon',
    accent: 'bg-maroon',
  },
  blue: {
    card: 'border-blue-200',
    icon: 'bg-blue-50 text-blue-600',
    value: 'text-blue-700',
    accent: 'bg-blue-500',
  },
};

export default function StatsCard({ title, value, subtitle, icon, color = 'forest' }: StatsCardProps) {
  const c = colorMap[color];
  return (
    <div className={cn('bg-white rounded-xl p-5 border shadow-soft hover:shadow-card transition-all', c.card)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1">{title}</p>
          <p className={cn('text-2xl font-bold font-heading truncate', c.value)}>{value}</p>
          {subtitle && <p className="text-[11px] text-neutral-400 mt-1 truncate">{subtitle}</p>}
        </div>
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', c.icon)}>
          {icon}
        </div>
      </div>
    </div>
  );
}
