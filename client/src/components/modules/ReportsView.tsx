import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { formatEgp, formatDate } from '../../utils/formatters';
import { useLanguage } from '../../context/LanguageContext';

export const ReportsView: React.FC = () => {
  const { language, t } = useLanguage();
  const [activeReport, setActiveReport] = useState<'orders' | 'efficiency'>('orders');
  const [ordersReport, setOrdersReport] = useState<any[]>([]);
  const [efficiencyReport, setEfficiencyReport] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [ordRes, effRes] = await Promise.all([
        apiRequest<{ report: any[] }>('/reports/orders-performance'),
        apiRequest<{ summary: any[] }>('/reports/production-efficiency'),
      ]);
      setOrdersReport(ordRes.report);
      setEfficiencyReport(effRes.summary);
    } catch (e) {
      console.error('Failed to load reports:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">
              {language === 'ar' ? 'التقارير التحليلية لمصنع العاشر من رمضان' : 'Analytical Production & Financial Reports'}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
              Operations Intelligence
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'ar'
              ? 'معدلات الالتزام بمواعيد التسليم، نسب الهالك، وكفاءة ساعات التشغيل المخططة مقابل الفعلية'
              : 'Delivery performance, scrap rates, and planned vs actual production hours.'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveReport('orders')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeReport === 'orders' ? 'bg-industrial-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {language === 'ar' ? 'تقرير التزام تسليم طلبات العملاء والربحية' : 'Order Delivery & Profitability'} ({ordersReport.length})
        </button>
        <button
          onClick={() => setActiveReport('efficiency')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeReport === 'efficiency' ? 'bg-industrial-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {language === 'ar' ? 'تقرير كفاءة مراحل التشغيل ونسب الهالك' : 'Work Center Efficiency & Scrap'} ({efficiencyReport.length})
        </button>
      </div>

      {/* TAB 1: ORDERS PERFORMANCE */}
      {activeReport === 'orders' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold">
                  <th className="py-3 px-4 text-start">{language === 'ar' ? 'رقم أمر المبيعات' : 'Order #'}</th>
                  <th className="py-3 px-4 text-start">{t.customer}</th>
                  <th className="py-3 px-4 text-start">{language === 'ar' ? 'تاريخ التعاقد' : 'Order Date'}</th>
                  <th className="py-3 px-4 text-start">{language === 'ar' ? 'الموعد النهائي للتسليم' : 'Delivery Deadline'}</th>
                  <th className="py-3 px-4 text-end">{language === 'ar' ? 'قيمة التعاقد الإجمالية' : 'Total Revenue'}</th>
                  <th className="py-3 px-4 text-end">{language === 'ar' ? 'تكلفة الإنتاج الفعلية' : 'Actual Cost'}</th>
                  <th className="py-3 px-4 text-end">{language === 'ar' ? 'صافي الربح المحقق' : 'Net Profit'}</th>
                  <th className="py-3 px-4 text-center">{language === 'ar' ? 'مؤشر التسليم' : 'Delivery Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ordersReport.map((rep, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{rep.orderNumber}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {language === 'en' ? (rep.customerNameEn || rep.customerNameAr || rep.customerName) : (rep.customerNameAr || rep.customerName)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{formatDate(rep.orderDate, language)}</td>
                    <td className="py-3.5 px-4 text-slate-600">{formatDate(rep.deliveryDeadline, language)}</td>
                    <td className="py-3.5 px-4 text-end font-bold text-slate-900">{formatEgp(rep.totalAmountEgp, language)}</td>
                    <td className="py-3.5 px-4 text-end font-mono text-slate-700">{formatEgp(rep.actualProductionCostEgp, language)}</td>
                    <td className="py-3.5 px-4 text-end font-mono font-bold text-emerald-800 bg-emerald-50/40">
                      {formatEgp(rep.profitEgp, language)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {rep.isDelayed ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">
                          {language === 'ar' ? 'متأخر عن الموعد' : 'Delayed'}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          {language === 'ar' ? 'منتظم وفق الجدول' : 'On Schedule'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCTION EFFICIENCY */}
      {activeReport === 'efficiency' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold">
                  <th className="py-3 px-4 text-start">{language === 'ar' ? 'مرحلة التشغيل' : 'Operation'}</th>
                  <th className="py-3 px-4 text-start">{language === 'ar' ? 'مركز العمل' : 'Work Center'}</th>
                  <th className="py-3 px-4 text-start">{language === 'ar' ? 'فني التشغيل' : 'Operator'}</th>
                  <th className="py-3 px-4 text-center">{language === 'ar' ? 'الساعات المخططة' : 'Planned Hours'}</th>
                  <th className="py-3 px-4 text-center">{language === 'ar' ? 'الساعات الفعلية' : 'Actual Hours'}</th>
                  <th className="py-3 px-4 text-center">{language === 'ar' ? 'معامل الكفاءة' : 'Efficiency'}</th>
                  <th className="py-3 px-4 text-center">{language === 'ar' ? 'نسبة الهالك / الخردة' : 'Scrap Rate'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {efficiencyReport.map((eff, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {language === 'en' ? (eff.operationNameEn || eff.operationNameAr || eff.operationName) : (eff.operationNameAr || eff.operationName)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono">
                      {language === 'en' ? (eff.workCenterEn || eff.workCenterAr || eff.workCenter) : (eff.workCenterAr || eff.workCenter)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {language === 'en' ? (eff.employeeEn || eff.employeeAr || eff.employee) : (eff.employeeAr || eff.employee)}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                      {eff.plannedHours} {language === 'ar' ? 'س' : 'h'}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                      {eff.actualHours} {language === 'ar' ? 'س' : 'h'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        eff.efficiencyRatio >= 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {eff.efficiencyRatio}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`font-mono font-bold ${eff.scrapRatePercent > 2 ? 'text-rose-700' : 'text-slate-700'}`}>
                        {eff.scrapRatePercent}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
