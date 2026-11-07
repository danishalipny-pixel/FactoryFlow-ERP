export const formatEgp = (amount: number | undefined | null, lang: 'ar' | 'en' = 'ar'): string => {
  if (amount === undefined || amount === null || isNaN(amount)) return lang === 'ar' ? '0 ج.م' : '0 EGP';
  
  const formatted = new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount);

  return lang === 'ar' ? `${formatted} ج.م` : `${formatted} EGP`;
};

export const formatDate = (dateString: string | Date | undefined | null, lang: 'ar' | 'en' = 'ar'): string => {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '-';

  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
};

export const formatDateTime = (dateString: string | Date | undefined | null, lang: 'ar' | 'en' = 'ar'): string => {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '-';

  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(d);
};

export const formatPercent = (value: number | undefined | null, lang: 'ar' | 'en' = 'ar'): string => {
  if (value === undefined || value === null || isNaN(value)) return '0%';
  return `${Math.round(value * 10) / 10}%`;
};

export const formatTaxNumber = (val: string | undefined | null): string => {
  if (!val) return '-';
  // If 9 digits without hyphens, format as XXX-XXX-XXX
  const clean = val.replace(/\D/g, '');
  if (clean.length === 9) {
    return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6)}`;
  }
  return val;
};
