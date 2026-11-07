import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { Product, BOM, WorkCenter } from '../../types/erp';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { formatEgp } from '../../utils/formatters';
import { useLanguage } from '../../context/LanguageContext';
import {
  Layers,
  Plus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const EngineeringView: React.FC = () => {
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'products' | 'boms' | 'workcenters'>('products');

  const [products, setProducts] = useState<Product[]>([]);
  const [boms, setBoms] = useState<BOM[]>([]);
  const [workCenters, setWorkCenters] = useState<WorkCenter[]>([]);
  const [loading, setLoading] = useState(true);

  // Expanded BOM state
  const [expandedBomId, setExpandedBomId] = useState<string | null>(null);

  // New Product Modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productForm, setProductForm] = useState({
    itemCode: '',
    nameAr: '',
    nameEn: '',
    category: 'RAW_MATERIAL' as any,
    unit: 'KG',
    standardCostEgp: 0,
    sellingPriceEgp: 0,
    drawingNumber: '',
    revision: 'Rev.01',
    safetyStock: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prdRes, bomRes, wcRes] = await Promise.all([
        apiRequest<{ products: Product[] }>('/engineering/products'),
        apiRequest<{ boms: BOM[] }>('/engineering/boms'),
        apiRequest<{ workCenters: WorkCenter[] }>('/engineering/work-centers'),
      ]);
      setProducts(prdRes.products);
      setBoms(bomRes.boms);
      setWorkCenters(wcRes.workCenters);
      if (bomRes.boms.length > 0) setExpandedBomId(bomRes.boms[0].id);
    } catch (e) {
      console.error('Failed to load engineering data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/engineering/products', {
        method: 'POST',
        body: JSON.stringify(productForm),
      });
      setIsProductModalOpen(false);
      setProductForm({
        itemCode: '',
        nameAr: '',
        nameEn: '',
        category: 'RAW_MATERIAL',
        unit: 'KG',
        standardCostEgp: 0,
        sellingPriceEgp: 0,
        drawingNumber: '',
        revision: 'Rev.01',
        safetyStock: 0,
      });
      fetchData();
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
              {language === 'ar' ? 'الهندسة وتصميم المنتجات ومراكز التشغيل' : 'Engineering, BOM & Work Centers'}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
              Technical Specs
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'ar'
              ? 'إدارة شجرة المنتج متعددة المستويات (BOM)، مسارات التشغيل، ومعدلات تكلفة الماكينات'
              : 'Multi-level BOM definitions, production routing steps, and machine hourly costs.'}
          </p>
        </div>

        <button
          onClick={() => setIsProductModalOpen(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'ar' ? 'إضافة صنف / خامة' : 'Add Item / Material'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'products' ? 'bg-industrial-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {language === 'ar' ? 'دليل الأصناف والخامات' : 'Product & Material Catalog'} ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('boms')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'boms' ? 'bg-industrial-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {language === 'ar' ? 'شجرة المنتجات (BOM)' : 'Bill of Materials (BOM)'} ({boms.length})
        </button>
        <button
          onClick={() => setActiveTab('workcenters')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'workcenters' ? 'bg-industrial-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {language === 'ar' ? 'مراكز التشغيل والماكينات' : 'Work Centers'} ({workCenters.length})
        </button>
      </div>

      {/* TAB 1: PRODUCTS & MATERIALS */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold">
                  <th className="py-3 px-4 text-start">{language === 'ar' ? 'كود الصنف' : 'Item Code'}</th>
                  <th className="py-3 px-4 text-start">{language === 'ar' ? 'اسم الصنف والمواصفة' : 'Description'}</th>
                  <th className="py-3 px-4 text-center">{language === 'ar' ? 'التصنيف' : 'Category'}</th>
                  <th className="py-3 px-4 text-center">{language === 'ar' ? 'الوحدة' : 'Unit'}</th>
                  <th className="py-3 px-4 text-start">{language === 'ar' ? 'رقم الرسم الهندسي' : 'Drawing #'}</th>
                  <th className="py-3 px-4 text-end">{language === 'ar' ? 'التكلفة القياسية' : 'Standard Cost'}</th>
                  <th className="py-3 px-4 text-end">{language === 'ar' ? 'سعر البيع المرجعي' : 'Selling Price'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{p.itemCode}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">
                        {language === 'en' ? (p.nameEn || p.nameAr) : p.nameAr}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {language === 'en' ? p.nameAr : p.nameEn}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        p.category === 'RAW_MATERIAL' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {p.category === 'RAW_MATERIAL'
                          ? (language === 'ar' ? 'خامة أولية' : 'Raw Material')
                          : (language === 'ar' ? 'منتج تام مخصص' : 'Finished Product')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-700">{p.unit}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono">
                      {p.drawingNumber ? `${p.drawingNumber} (${p.revision})` : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-end font-mono text-slate-700">{formatEgp(p.standardCostEgp, language)}</td>
                    <td className="py-3.5 px-4 text-end font-bold text-slate-900">{formatEgp(p.sellingPriceEgp, language)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: BILL OF MATERIALS (BOM) */}
      {activeTab === 'boms' && (
        <div className="space-y-4">
          {boms.map((bom) => {
            const isExpanded = expandedBomId === bom.id;
            return (
              <div key={bom.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div
                  onClick={() => setExpandedBomId(isExpanded ? null : bom.id)}
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-industrial-100 text-industrial-800 rounded-xl font-bold">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm">
                          {language === 'en' ? (bom.nameEn || bom.product?.nameEn || bom.nameAr) : bom.nameAr}
                        </h4>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-mono font-semibold">
                          v{bom.version}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {language === 'ar' ? 'نسبة الكفاءة:' : 'Yield:'} {bom.yieldPercent}% | {language === 'ar' ? 'تكلفة الخامات التقديرية:' : 'Est Material Cost:'} {formatEgp(bom.estimatedMaterialCost, language)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                      {bom.items?.length || 0} {language === 'ar' ? 'مكونات' : 'Components'}
                    </span>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-200 p-5 bg-slate-50/50">
                    <h5 className="font-bold text-slate-900 text-xs mb-3">
                      {language === 'ar' ? 'مكونات شجرة المنتج لوحدة واحدة:' : 'Bill of Materials Components (Per Unit):'}
                    </h5>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-start bg-white rounded-xl border border-slate-200">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-semibold">
                            <th className="py-2.5 px-3 text-start">{language === 'ar' ? 'كود الخامة' : 'Item Code'}</th>
                            <th className="py-2.5 px-3 text-start">{language === 'ar' ? 'اسم الخامة والمواصفة' : 'Component Name'}</th>
                            <th className="py-2.5 px-3 text-end">{language === 'ar' ? 'الكمية لكل وحدة' : 'Qty / Unit'}</th>
                            <th className="py-2.5 px-3 text-center">{language === 'ar' ? 'الوحدة' : 'Unit'}</th>
                            <th className="py-2.5 px-3 text-center">{language === 'ar' ? 'نسبة الهالك الطبيعي' : 'Scrap %'}</th>
                            <th className="py-2.5 px-3 text-start">{language === 'ar' ? 'ملاحظات الاستخدام' : 'Notes'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {bom.items?.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50">
                              <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{item.component?.itemCode}</td>
                              <td className="py-2.5 px-3 font-medium text-slate-900">
                                {language === 'en'
                                  ? (item.component?.nameEn || item.component?.nameAr)
                                  : (item.component?.nameAr || item.component?.nameEn)}
                              </td>
                              <td className="py-2.5 px-3 text-end font-mono font-bold text-emerald-700">{item.quantity}</td>
                              <td className="py-2.5 px-3 text-center text-slate-600 font-semibold">{item.unit}</td>
                              <td className="py-2.5 px-3 text-center font-mono text-amber-700 font-semibold">{item.scrapPercentage}%</td>
                              <td className="py-2.5 px-3 text-slate-500">{item.notes || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: WORK CENTERS */}
      {activeTab === 'workcenters' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workCenters.map((wc) => (
            <div key={wc.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-emerald-700">{wc.code}</span>
                  <h4 className="font-bold text-slate-900 text-sm mt-0.5">
                    {language === 'en' ? wc.nameEn : wc.nameAr}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {language === 'en' ? wc.nameAr : wc.nameEn}
                  </p>
                </div>
                <Badge status={wc.status} />
              </div>

              <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>{language === 'ar' ? 'سعة التشغيل اليومية:' : 'Daily Capacity:'}</span>
                  <span className="font-bold text-slate-900">
                    {wc.capacityHoursPerDay} {language === 'ar' ? 'ساعة (ورديتان)' : 'hours (2 shifts)'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>{language === 'ar' ? 'تكلفة تشغيل الماكينة بالساعة:' : 'Machine Hourly Rate:'}</span>
                  <span className="font-bold text-emerald-700 font-mono">
                    {formatEgp(wc.hourlyCostRateEgp, language)}{language === 'ar' ? '/ساعة' : '/hr'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>{language === 'ar' ? 'معامل الكفاءة الميكانيكية:' : 'Mechanical Efficiency:'}</span>
                  <span className="font-bold text-slate-900 font-mono">{wc.efficiencyPercent}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: ADD PRODUCT / MATERIAL */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={language === 'ar' ? 'إضافة صنف أو خامة صناعية جديدة' : 'Add New Item / Material'}
        subtitle={language === 'ar' ? 'تعريف كود الصنف والمواصفات والتكلفة القياسية' : 'Standard engineering specifications'}
      >
        <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'ar' ? 'كود الصنف (Item Code) *' : 'Item Code *'}
              </label>
              <input
                type="text"
                required
                value={productForm.itemCode}
                onChange={(e) => setProductForm({ ...productForm, itemCode: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-emerald-500 outline-none uppercase"
                placeholder="RM-STL-3MM"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'ar' ? 'التصنيف *' : 'Category *'}
              </label>
              <select
                value={productForm.category}
                onChange={(e) => setProductForm({ ...productForm, category: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
              >
                <option value="RAW_MATERIAL">
                  {language === 'ar' ? 'خامة أولية (Raw Material)' : 'Raw Material'}
                </option>
                <option value="FINISHED_PRODUCT">
                  {language === 'ar' ? 'منتج تام مخصص (Finished Product)' : 'Finished Product (MTO)'}
                </option>
                <option value="SUB_ASSEMBLY">
                  {language === 'ar' ? 'مكون نصف مصنع (Sub-Assembly)' : 'Sub-Assembly'}
                </option>
                <option value="CONSUMABLE">
                  {language === 'ar' ? 'مستلزمات تشغيل (Consumable)' : 'Consumable'}
                </option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'ar' ? 'اسم الصنف بالعربية *' : 'Name in Arabic *'}
              </label>
              <input
                type="text"
                required
                value={productForm.nameAr}
                onChange={(e) => setProductForm({ ...productForm, nameAr: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder={language === 'ar' ? 'مثال: ألواح ستانلس ستيل 316L سمك 3 مم' : 'Arabic specification'}
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'ar' ? 'اسم الصنف بالإنجليزية' : 'Name in English'}
              </label>
              <input
                type="text"
                value={productForm.nameEn}
                onChange={(e) => setProductForm({ ...productForm, nameEn: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="e.g. Stainless Steel 316L Sheets 3mm"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'ar' ? 'وحدة القياس' : 'Unit'}
              </label>
              <select
                value={productForm.unit}
                onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
              >
                <option value="KG">{language === 'ar' ? 'كجم (KG)' : 'KG'}</option>
                <option value="METER">{language === 'ar' ? 'متر (METER)' : 'Meter'}</option>
                <option value="PIECE">{language === 'ar' ? 'قطعة (PIECE)' : 'Piece'}</option>
                <option value="SHEET">{language === 'ar' ? 'لوح (SHEET)' : 'Sheet'}</option>
                <option value="TON">{language === 'ar' ? 'طن (TON)' : 'Ton'}</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'ar' ? 'التكلفة القياسية (ج.م)' : 'Standard Cost (EGP)'}
              </label>
              <input
                type="number"
                value={productForm.standardCostEgp}
                onChange={(e) => setProductForm({ ...productForm, standardCostEgp: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'ar' ? 'سعر البيع (ج.م)' : 'Selling Price (EGP)'}
              </label>
              <input
                type="number"
                value={productForm.sellingPriceEgp}
                onChange={(e) => setProductForm({ ...productForm, sellingPriceEgp: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsProductModalOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm"
            >
              {t.save}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
