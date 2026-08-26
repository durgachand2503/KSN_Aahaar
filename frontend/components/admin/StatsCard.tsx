'use client';

import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'forest' | 'gold' | 'maroon' | 'blue';
}

const colorStyles = {
  forest: 'bg-forest/5 text-forest',
  gold: 'bg-gold/10 text-gold-dark',
  maroon: 'bg-maroon/5 text-maroon',
  blue: 'bg-blue-50 text-blue-600',
};

export default function StatsCard({ title, value, subtitle, icon, color = 'forest' }: StatsCardProps) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-soft hover:shadow-card transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-forest mt-1 font-heading">{value}</p>
          {subtitle && <p className="text-xs text-neutral-400 mt-0.5">{subtitle}</p>}
        </div>
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', colorStyles[color])}>
          {icon}
        </div>
      </div>
    </div>
  );
}
