import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { QualityInspection, Product, ProductionOrder } from '../../types/erp';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { formatDate } from '../../utils/formatters';
import { useLanguage } from '../../context/LanguageContext';
import {
  ShieldCheck,
  Plus,
} from 'lucide-react';

export const QualityView: React.FC = () => {
  const { language, t } = useLanguage();
  const [inspections, setInspections] = useState<QualityInspection[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // New Inspection Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [type, setType] = useState('IN_PROCESS');
  const [productId, setProductId] = useState('');
  const [orderId, setOrderId] = useState('');
  const [inspectedQty, setInspectedQty] = useState(1);
  const [passedQty, setPassedQty] = useState(1);
  const [rejectedQty, setRejectedQty] = useState(0);
  const [result, setResult] = useState('PASSED');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchQualityData();
  }, []);

  const fetchQualityData = async () => {
    try {
      setLoading(true);
      const [qcRes, prdRes, ordRes] = await Promise.all([
        apiRequest<{ inspections: QualityInspection[] }>('/quality/inspections'),
        apiRequest<{ products: Product[] }>('/engineering/products'),
        apiRequest<{ orders: ProductionOrder[] }>('/production/orders'),
      ]);
      setInspections(qcRes.inspections);
      setProducts(prdRes.products);
      setOrders(ordRes.orders);
      if (prdRes.products.length > 0) setProductId(prdRes.products[0].id);
      if (ordRes.orders.length > 0) setOrderId(ordRes.orders[0].id);
    } catch (e) {
      console.error('Failed to load quality data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/quality/inspections', {
        method: 'POST',
        body: JSON.stringify({
          type,
          productionOrderId: orderId || undefined,
          productId,
          inspectedQuantity: inspectedQty,
          passedQuantity: passedQty,
          rejectedQuantity: rejectedQty,
          result,
          notes,
        }),
      });
      setIsModalOpen(false);
      alert(language === 'ar' ? '✅ تم تسجيل فحص الجودة بنجاح!' : '✅ Quality inspection logged successfully!');
      fetchQualityData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">
              {language === 'ar' ? 'إدارة توكيد ومراقبة الجودة والتفتيش (QC)' : 'Quality Assurance & Inspection (QA/QC)'}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              ISO / IEC Standards
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'ar'
              ? 'فحص استلام الخامات، الفحص المرحلي أثناء التشغيل، والفحص النهائي قبل التسليم'
              : 'Incoming material verification, in-process routing checks, and final product QA.'}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'ar' ? 'تسجيل تقرير فحص جودة' : 'Log New Inspection'}</span>
        </button>
      </div>

      {/* Inspections Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold">
                <th className="py-3 px-4 text-start">{language === 'ar' ? 'رقم تقرير الفحص' : 'QC Report #'}</th>
                <th className="py-3 px-4 text-start">{language === 'ar' ? 'نوع الفحص' : 'Inspection Type'}</th>
                <th className="py-3 px-4 text-start">{t.product}</th>
                <th className="py-3 px-4 text-start">{language === 'ar' ? 'أمر الإنتاج / العميل' : 'Production Order / Customer'}</th>
                <th className="py-3 px-4 text-center">{language === 'ar' ? 'المفحوص' : 'Inspected'}</th>
                <th className="py-3 px-4 text-center">{language === 'ar' ? 'المقبول' : 'Passed'}</th>
                <th className="py-3 px-4 text-center">{language === 'ar' ? 'المرفوض' : 'Rejected'}</th>
                <th className="py-3 px-4 text-start">{language === 'ar' ? 'تاريخ الفحص' : 'Date'}</th>
                <th className="py-3 px-4 text-center">{language === 'ar' ? 'النتيجة النهائية' : 'QC Result'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inspections.map((qc) => (
                <tr key={qc.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{qc.inspectionNumber}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-700">
                    {qc.type === 'FINAL_PRODUCT'
                      ? (language === 'ar' ? 'فحص نهائي' : 'Final Product QC')
                      : qc.type === 'IN_PROCESS'
                      ? (language === 'ar' ? 'فحص مرحلي' : 'In-Process QC')
                      : (language === 'ar' ? 'فحص خامات واردة' : 'Incoming Material')}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-900">
                    {language === 'en' ? (qc.product.nameEn || qc.product.nameAr) : (qc.product.nameAr || qc.product.nameEn)}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-mono">
                    {qc.productionOrder ? (
                      <span>
                        {qc.productionOrder.orderNumber} (
                        {language === 'en'
                          ? (qc.productionOrder.salesOrder?.customer?.nameEn || qc.productionOrder.salesOrder?.customer?.nameAr)
                          : (qc.productionOrder.salesOrder?.customer?.nameAr || qc.productionOrder.salesOrder?.customer?.nameEn)}
                        )
                      </span>
                    ) : '-'}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-800">{qc.inspectedQuantity}</td>
                  <td className="py-3.5 px-4 text-center font-bold text-emerald-700">{qc.passedQuantity}</td>
                  <td className="py-3.5 px-4 text-center font-bold text-rose-700">{qc.rejectedQuantity}</td>
                  <td className="py-3.5 px-4 text-slate-600">{formatDate(qc.inspectionDate, language)}</td>
                  <td className="py-3.5 px-4 text-center">
                    <Badge status={qc.result} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: NEW INSPECTION */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={language === 'ar' ? 'تسجيل تقرير فحص جودة وتفتيش جديد' : 'Log New Quality Inspection Report'}
        subtitle={language === 'ar' ? 'توثيق المطابقة للمعايير الهندسية' : 'Document technical tolerance and standards compliance'}
      >
        <form onSubmit={handleCreateInspection} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'ar' ? 'نوع الفحص *' : 'Inspection Type *'}
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
              >
                <option value="IN_PROCESS">
                  {language === 'ar' ? 'فحص مرحلي بالورش (In-Process)' : 'In-Process Inspection'}
                </option>
                <option value="FINAL_PRODUCT">
                  {language === 'ar' ? 'فحص نهائي للمنتج التام (Final QC)' : 'Final Product QA'}
                </option>
                <option value="INCOMING_MATERIAL">
                  {language === 'ar' ? 'فحص خامات موردة (Incoming)' : 'Incoming Material Inspection'}
                </option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'ar' ? 'أمر الإنتاج المرتبط' : 'Production Order'}
              </label>
              <select
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
              >
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.orderNumber} - {language === 'en' ? (o.product.nameEn || o.product.nameAr) : o.product.nameAr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'ar' ? 'الكمية المفحوصة *' : 'Inspected Qty *'}
              </label>
              <input
                type="number"
                min="1"
                value={inspectedQty}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setInspectedQty(val);
                  setPassedQty(val);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-emerald-700 mb-1">
                {language === 'ar' ? 'الكمية المقبولة' : 'Passed Qty'}
              </label>
              <input
                type="number"
                value={passedQty}
                onChange={(e) => setPassedQty(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-rose-700 mb-1">
                {language === 'ar' ? 'الكمية المرفوضة' : 'Rejected Qty'}
              </label>
              <input
                type="number"
                value={rejectedQty}
                onChange={(e) => setRejectedQty(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {language === 'ar' ? 'القرار والنتيجة *' : 'Quality Verdict *'}
            </label>
            <select
              value={result}
              onChange={(e) => setResult(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-bold"
            >
              <option value="PASSED">
                {language === 'ar' ? 'مطابق ومعتمد (PASSED)' : 'Passed & Approved (PASSED)'}
              </option>
              <option value="REWORK_REQUIRED">
                {language === 'ar' ? 'يتطلب إعادة تشغيل وتعديل (REWORK)' : 'Rework Required (REWORK)'}
              </option>
              <option value="REJECTED">
                {language === 'ar' ? 'مرفوض نهائياً وتكهين (REJECTED)' : 'Scrapped & Rejected (REJECTED)'}
              </option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {language === 'ar' ? 'ملاحظات التفتيش والاختبار' : 'Inspection & Test Notes'}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              placeholder={
                language === 'ar'
                  ? 'مثال: تم قياس سماكة طبقة الدهان ووجد أنها 80 ميكرون ومطابقة للمواصفة...'
                  : 'e.g. Ultrasonic weld test completed, zero internal porosity, tolerance within ±0.2mm...'
              }
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm"
            >
              {language === 'ar' ? 'حفظ التقرير' : 'Save Inspection'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
