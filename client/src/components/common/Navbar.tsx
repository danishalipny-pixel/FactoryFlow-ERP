import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Globe, Shield, Building2 } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, switchRole } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();

  const enterpriseRoles = [
    { key: 'SUPER_ADMIN', ar: 'المدير التقني للنظام', en: 'Super Admin' },
    { key: 'FACTORY_OWNER', ar: 'مالك ورئيس مجلس الإدارة', en: 'Factory Owner' },
    { key: 'GENERAL_MANAGER', ar: 'المدير العام', en: 'General Manager' },
    { key: 'SALES_MANAGER', ar: 'مدير المبيعات والعقود', en: 'Sales Manager' },
    { key: 'PRODUCTION_MANAGER', ar: 'مدير الإنتاج والعمليات', en: 'Production Manager' },
    { key: 'PROCUREMENT_MANAGER', ar: 'مدير المشتريات والتوريدات', en: 'Procurement Manager' },
    { key: 'WAREHOUSE_MANAGER', ar: 'مدير المخازن واللوجستيات', en: 'Warehouse Manager' },
    { key: 'ACCOUNTANT', ar: 'رئيس الحسابات والمالية', en: 'Chief Accountant' },
    { key: 'HR_MANAGER', ar: 'مدير الموارد البشرية', en: 'HR Manager' },
    { key: 'QUALITY_INSPECTOR', ar: 'مهندس فحص وتوكيد الجودة', en: 'Quality Inspector' },
    { key: 'PRODUCTION_OPERATOR', ar: 'فني تشغيل خطوط الإنتاج', en: 'Production Operator' },
  ];

  const companyName = language === 'en'
    ? 'Al-Ahram Engineering & Metal Industries'
    : 'مصنع الأهرام للصناعات الهندسية والمعدنية';

  const companyLocation = language === 'en'
    ? '10th of Ramadan City, Sharkia, Egypt'
    : 'العاشر من رمضان، محافظة الشرقية (مصر)';

  const userDisplayName = language === 'en'
    ? (user?.fullNameEn || user?.fullNameAr || 'Admin')
    : (user?.fullNameAr || user?.fullNameEn || 'المسؤول');

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3.5 bg-white border-b border-slate-200/80 shadow-sm">
      {/* Factory and Location Badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-industrial-900 text-white font-bold text-base shadow-sm">
          FF
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 tracking-tight text-sm">
              {companyName}
            </span>
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-100 text-emerald-800 rounded-md">
              {language === 'en' ? 'MTO Active' : 'تصنيع حسب الطلب'}
            </span>
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <Building2 className="w-3 h-3 text-slate-400" />
            {companyLocation}
          </p>
        </div>
      </div>

      {/* Right Controls: Role Switcher, Language Toggle, User profile */}
      <div className="flex items-center gap-4">
        {/* Role Switcher */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
          <Shield className="w-4 h-4 text-amber-600" />
          <span className="text-slate-500 font-medium hidden sm:inline">
            {language === 'en' ? 'Role:' : 'الدور:'}
          </span>
          <select
            value={user?.role || 'SUPER_ADMIN'}
            onChange={(e) => switchRole(e.target.value)}
            className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
          >
            {enterpriseRoles.map((r) => (
              <option key={r.key} value={r.key}>
                {language === 'en' ? r.en : r.ar}
              </option>
            ))}
          </select>
        </div>

        {/* Language Switcher */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          title={language === 'en' ? 'Switch to Arabic' : 'Switch to English'}
        >
          <Globe className="w-3.5 h-3.5 text-slate-500" />
          <span>{language === 'en' ? 'العربية (RTL)' : 'English'}</span>
        </button>

        {/* Current User Badge */}
        <div className="flex items-center gap-2.5 border-s ps-4 border-slate-200">
          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
            {userDisplayName.slice(0, 1)}
          </div>
          <div className="hidden md:block text-start">
            <p className="text-xs font-bold text-slate-900 leading-tight">
              {userDisplayName}
            </p>
            <p className="text-[11px] font-medium text-emerald-700">
              {(t as any)[user?.role || ''] || user?.role}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
