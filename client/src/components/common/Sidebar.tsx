import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
  LayoutDashboard,
  ShoppingBag,
  Cpu,
  Factory,
  Boxes,
  Truck,
  Receipt,
  ShieldCheck,
  Users,
  BarChart3,
  Sparkles,
  Settings,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { clsx } from 'clsx';

export type ActiveTab =
  | 'dashboard'
  | 'sales'
  | 'engineering'
  | 'production'
  | 'inventory'
  | 'procurement'
  | 'finance'
  | 'quality'
  | 'workforce'
  | 'reports'
  | 'ai'
  | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { t, isRtl, language } = useLanguage();

  const navItems = [
    { id: 'dashboard' as ActiveTab, label: t.dashboard, icon: LayoutDashboard },
    { id: 'sales' as ActiveTab, label: t.crmSales, icon: ShoppingBag, badge: 'MTO' },
    { id: 'engineering' as ActiveTab, label: t.engineering, icon: Cpu },
    { id: 'production' as ActiveTab, label: t.production, icon: Factory },
    { id: 'inventory' as ActiveTab, label: t.inventory, icon: Boxes },
    { id: 'procurement' as ActiveTab, label: t.procurement, icon: Truck },
    { id: 'finance' as ActiveTab, label: t.finance, icon: Receipt, badge: 'ETA' },
    { id: 'quality' as ActiveTab, label: t.quality, icon: ShieldCheck },
    { id: 'workforce' as ActiveTab, label: t.workforce, icon: Users },
    { id: 'reports' as ActiveTab, label: t.reports, icon: BarChart3 },
    { id: 'ai' as ActiveTab, label: t.aiAssistant, icon: Sparkles, highlight: true },
    { id: 'settings' as ActiveTab, label: t.settings, icon: Settings },
  ];

  return (
    <aside className="w-64 bg-industrial-900 text-slate-300 flex flex-col shrink-0 min-h-screen border-e border-industrial-700 shadow-xl select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-industrial-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white shadow-md">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-white text-lg tracking-wider">FACTORYFLOW</h1>
            <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-widest">
              Egypt MTO Edition
            </p>
          </div>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={clsx(
                'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150',
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                  : item.highlight
                  ? 'bg-industrial-800/90 text-emerald-300 hover:bg-industrial-800 hover:text-white border border-emerald-500/20'
                  : 'text-slate-300 hover:bg-industrial-800 hover:text-white'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={clsx(
                    'w-4 h-4',
                    isActive ? 'text-white' : item.highlight ? 'text-emerald-400' : 'text-slate-400'
                  )}
                />
                <span>{item.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {item.badge && (
                  <span
                    className={clsx(
                      'px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight',
                      isActive ? 'bg-white/20 text-white' : 'bg-industrial-700 text-emerald-300'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
                {item.highlight && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-industrial-800 bg-industrial-950/40 text-[11px] text-slate-400 space-y-1">
        <div className="flex items-center justify-between">
          <span>{language === 'ar' ? 'العملة الرسمية:' : 'Currency:'}</span>
          <span className="font-bold text-slate-200">EGP ({language === 'ar' ? 'ج.م' : 'Egyptian Pound'})</span>
        </div>
        <div className="flex items-center justify-between">
          <span>{language === 'ar' ? 'ضريبة القيمة المضافة:' : 'VAT Rate:'}</span>
          <span className="font-bold text-emerald-400">14% (ETA Ready)</span>
        </div>
        <div className="flex items-center justify-between">
          <span>{language === 'ar' ? 'ضريبة الخصم:' : 'WHT Rate:'}</span>
          <span className="font-bold text-slate-200">1% (WHT)</span>
        </div>
      </div>
    </aside>
  );
};
