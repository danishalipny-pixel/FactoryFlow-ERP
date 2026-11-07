import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';
import { formatEgp, formatDate, formatPercent } from '../../utils/formatters';
import { useLanguage } from '../../context/LanguageContext';
import {
  ShoppingBag,
  Factory,
  AlertTriangle,
  Receipt,
  Boxes,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Activity,
  Layers,
} from 'lucide-react';

export const DashboardView: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { language, isRtl, t } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/dashboard/metrics');
      setData(res);
    } catch (e) {
      console.error('Failed to load dashboard metrics:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-500">
            {language === 'en' ? 'Loading live factory metrics...' : 'جاري تحميل مؤشرات المصنع الحية...'}
          </p>
        </div>
      </div>
    );
  }

  const s = data?.summary || {};
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header & Factory Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">
              {language === 'en'
                ? 'Executive Make-to-Order (MTO) Manufacturing Dashboard'
                : 'لوحة المتابعة التنفيذية للتصنيع حسب الطلب (MTO)'}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              {language === 'en' ? 'Live Data' : 'مؤشرات حية'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'en'
              ? 'Real-time traceability from customer orders to material reservations, work operations, and order profitability.'
              : 'متابعة شاملة من طلب العميل، حجز الخامات، عمليات التشغيل، وتكلفة أوامر التوريد'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadMetrics}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-2"
          >
            <Activity className="w-4 h-4 text-emerald-600" />
            <span>{t.refresh}</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={language === 'en' ? 'Confirmed Sales Orders' : 'أوامر المبيعات المؤكدة'}
          value={s.totalSalesOrders || 0}
          subtitle={language === 'en' ? 'Triggers MTO production' : 'مصدر أوامر التشغيل المباشرة'}
          icon={ShoppingBag}
          variant="blue"
          onClick={() => onNavigate('sales')}
        />
        <StatCard
          title={language === 'en' ? 'Active Production Orders' : 'أوامر الإنتاج النشطة'}
          value={s.activeProductionOrders || 0}
          subtitle={language === 'en' ? 'In fabrication & assembly' : 'خطوط التشغيل والتجميع'}
          icon={Factory}
          variant="emerald"
          onClick={() => onNavigate('production')}
        />
        <StatCard
          title={language === 'en' ? 'Material Shortages' : 'عجز الخامات والمواد'}
          value={s.shortagesCount || 0}
          subtitle={language === 'en' ? 'Requires urgent procurement' : 'يتطلب تعميد مشتريات عاجل'}
          icon={AlertTriangle}
          variant={s.shortagesCount > 0 ? 'rose' : 'default'}
          onClick={() => onNavigate('procurement')}
        />
        <StatCard
          title={language === 'en' ? 'Invoiced Revenue' : 'إجمالي الإيرادات المفوترة'}
          value={formatEgp(s.totalInvoicedEgp, language)}
          subtitle={`${language === 'en' ? 'Collected:' : 'المحصل:'} ${formatEgp(s.totalCollectedEgp, language)}`}
          icon={Receipt}
          variant="emerald"
          onClick={() => onNavigate('finance')}
        />
      </div>

      {/* MTO Lifecycle Flow Diagram Interactive Card */}
      <div className="bg-gradient-to-r from-industrial-900 via-industrial-800 to-slate-900 rounded-2xl p-5 text-white shadow-lg border border-industrial-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold tracking-wide uppercase">
              {language === 'en' ? 'Make-To-Order Manufacturing Workflow' : 'دورة حياة التصنيع حسب الطلب (MTO Workflow)'}
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {language === 'en' ? 'Zero MTS Policy' : 'سياسة عدم التصنيع للمخزن'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-xs">
          {[
            { step: '1', ar: 'طلب العميل', en: '1. Sales Order' },
            { step: '2', ar: 'شجرة المنتج BOM', en: '2. BOM Explosion' },
            { step: '3', ar: 'حجز الخامات', en: '3. Material Reserve' },
            { step: '4', ar: 'أمر الإنتاج', en: '4. Production Order' },
            { step: '5', ar: 'مراحل التشغيل', en: '5. Work Operations' },
            { step: '6', ar: 'فحص الجودة', en: '6. QC Inspection' },
            { step: '7', ar: 'فاتورة الضرائب', en: '7. ETA E-Invoice' },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-industrial-800/80 border border-industrial-700 rounded-xl p-3 flex flex-col items-center justify-center relative hover:border-emerald-500 transition-colors"
            >
              <span className="font-semibold text-slate-200">
                {language === 'en' ? item.en : item.ar}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Urgent Material Shortages Alert (if any) */}
      {data?.materialShortages?.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-rose-900 text-sm">
                  {language === 'en' ? 'Active Material Shortages Alert' : 'تنبيه عجز خامات يعيق خطوط الإنتاج MTO'}
                </h4>
                <p className="text-xs text-rose-700 mt-0.5">
                  {language === 'en'
                    ? 'The following reserved materials have shortages against confirmed sales orders. Automated purchase requisitions are active.'
                    : 'الخامات التالية مطلوبة لتنفيذ أوامر الإنتاج ولكن رصيد المخزن الحالي غير كافٍ. تم إنشاء طلبات شراء عاجلة.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('procurement')}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shrink-0"
            >
              <span>{language === 'en' ? 'Procurement' : 'إدارة المشتريات'}</span>
              <ArrowIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.materialShortages.map((ms: any) => {
              const matName = language === 'en' ? (ms.materialNameEn || ms.materialNameAr) : ms.materialNameAr;
              const custName = language === 'en' ? (ms.customerNameEn || ms.customerNameAr) : ms.customerNameAr;
              return (
                <div key={ms.id} className="bg-white border border-rose-200/80 rounded-xl p-3 text-xs flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-900">{matName}</span>
                    <span className="text-slate-500 font-mono ms-2">({ms.itemCode})</span>
                    <div className="text-[11px] text-slate-500 mt-1">
                      {language === 'en' ? 'For Order:' : 'مخصص لأمر:'} <span className="font-semibold text-slate-800">{ms.productionOrderNumber}</span> ({custName})
                    </div>
                  </div>
                  <div className="text-end">
                    <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 font-bold text-xs">
                      -{ms.shortageQuantity} {ms.unit}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Two Column Grid: Order Profitability & Work Center Loads */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Profitability (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {language === 'en' ? 'Order-Level Costing & Profitability' : 'تحليل التكاليف والربحية لكل أمر عميل (Order Costing & Margin)'}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'en'
                  ? 'Contract revenue vs actual direct materials, labor, and machine overhead.'
                  : 'مقارنة إيراد البيع بالتكلفة الفعلية (خامات + عمالة + استهلاك ماكينات)'}
              </p>
            </div>
            <button
              onClick={() => onNavigate('finance')}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <span>{language === 'en' ? 'View Finance' : 'التفاصيل المالية'}</span>
              <ArrowIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 font-semibold bg-slate-50/60">
                  <th className="py-2.5 px-3 text-start">{language === 'en' ? 'Job Order #' : 'أمر التشغيل'}</th>
                  <th className="py-2.5 px-3 text-start">{t.customer}</th>
                  <th className="py-2.5 px-3 text-start">{t.product}</th>
                  <th className="py-2.5 px-3 text-end">{language === 'en' ? 'Revenue' : 'إيراد البيع'}</th>
                  <th className="py-2.5 px-3 text-end">{language === 'en' ? 'Actual Cost' : 'التكلفة الفعلية'}</th>
                  <th className="py-2.5 px-3 text-end">{language === 'en' ? 'Margin %' : 'هامش الربح'}</th>
                  <th className="py-2.5 px-3 text-center">{t.status}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.orderProfitability?.map((op: any, i: number) => {
                  const custName = language === 'en' ? (op.customerNameEn || op.customerNameAr) : op.customerNameAr;
                  const prdName = language === 'en' ? (op.productNameEn || op.productNameAr) : op.productNameAr;
                  return (
                    <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-800">{op.orderNumber}</td>
                      <td className="py-3 px-3 font-medium text-slate-900">{custName}</td>
                      <td className="py-3 px-3 text-slate-600 truncate max-w-[180px]">{prdName}</td>
                      <td className="py-3 px-3 text-end font-semibold text-slate-900">{formatEgp(op.revenueEgp, language)}</td>
                      <td className="py-3 px-3 text-end font-mono text-slate-700">{formatEgp(op.actualCostEgp, language)}</td>
                      <td className="py-3 px-3 text-end">
                        <span className={`font-bold ${op.marginPercent >= 25 ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {formatPercent(op.marginPercent, language)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge status={op.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Work Center Loads (1 col) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              {language === 'en' ? 'Work Centers Load & Capacity' : 'إشغال مراكز التشغيل والماكينات'}
            </h3>
            <p className="text-xs text-slate-500">
              {language === 'en'
                ? 'Active jobs and machine hourly operational cost.'
                : 'متابعة العمليات الجارية ومعدل الساعة'}
            </p>
          </div>

          <div className="space-y-3">
            {data?.workCenterLoads?.map((wc: any) => {
              const wcName = language === 'en' ? (wc.nameEn || wc.nameAr) : wc.nameAr;
              return (
                <div key={wc.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">{wcName}</span>
                    <Badge status={wc.status} />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{language === 'en' ? 'Code:' : 'كود:'} {wc.code}</span>
                    <span className="font-mono">{formatEgp(wc.hourlyCost, language)} / {language === 'en' ? 'hr' : 'ساعة'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                    <span className="text-slate-600">{language === 'en' ? 'Active Jobs:' : 'عمليات جارية:'}</span>
                    <span className="font-bold text-slate-900 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {wc.activeJobsCount}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
