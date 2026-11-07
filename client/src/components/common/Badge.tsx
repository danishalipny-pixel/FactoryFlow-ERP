import React from 'react';
import { clsx } from 'clsx';
import { useLanguage } from '../../context/LanguageContext';

interface BadgeProps {
  status: string;
  className?: string;
  children?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ status, className, children }) => {
  const { t } = useLanguage();
  const label = children || (t as any)[status] || status;

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  switch (status) {
    case 'CONFIRMED':
    case 'COMPLETED':
    case 'DELIVERED':
    case 'PASSED':
    case 'PAID':
    case 'Valid':
    case 'OPERATIONAL':
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-300';
      break;
    case 'IN_PRODUCTION':
    case 'RELEASED':
    case 'PARTIAL':
      colorClasses = 'bg-blue-50 text-blue-700 border-blue-300';
      break;
    case 'PENDING':
    case 'PAUSED':
    case 'QC_INSPECTION':
    case 'DRAFT':
    case 'NOT_SUBMITTED':
      colorClasses = 'bg-amber-50 text-amber-700 border-amber-300';
      break;
    case 'SHORTAGE':
    case 'REJECTED':
    case 'CANCELLED':
    case 'MAINTENANCE':
    case 'UNPAID':
      colorClasses = 'bg-rose-50 text-rose-700 border-rose-300';
      break;
    case 'RESERVED':
    case 'ISSUED':
      colorClasses = 'bg-indigo-50 text-indigo-700 border-indigo-300';
      break;
    default:
      colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
        colorClasses,
        className
      )}
    >
      {label}
    </span>
  );
};
