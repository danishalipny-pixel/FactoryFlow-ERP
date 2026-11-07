import React from 'react';
import { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'default' | 'emerald' | 'amber' | 'rose' | 'blue';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  onClick,
}) => {
  const variantStyles = {
    default: 'bg-white border-slate-200 text-slate-900',
    emerald: 'bg-emerald-50/60 border-emerald-200 text-emerald-950',
    amber: 'bg-amber-50/60 border-amber-200 text-amber-950',
    rose: 'bg-rose-50/60 border-rose-200 text-rose-950',
    blue: 'bg-blue-50/60 border-blue-200 text-blue-950',
  };

  const iconColors = {
    default: 'text-slate-600 bg-slate-100',
    emerald: 'text-emerald-600 bg-emerald-100',
    amber: 'text-amber-600 bg-amber-100',
    rose: 'text-rose-600 bg-rose-100',
    blue: 'text-blue-600 bg-blue-100',
  };

  return (
    <div
      onClick={onClick}
      className={clsx(
        'rounded-xl border p-5 shadow-sm transition-all duration-200 hover:shadow-md',
        variantStyles[variant],
        onClick && 'cursor-pointer hover:-translate-y-0.5'
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</h3>
          {subtitle && <p className="mt-1 text-xs text-slate-500 font-medium">{subtitle}</p>}
        </div>
        <div className={clsx('p-3 rounded-xl', iconColors[variant])}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};
