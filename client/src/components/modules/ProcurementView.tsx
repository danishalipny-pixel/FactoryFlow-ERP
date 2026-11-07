import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { Supplier, PurchaseOrder, PurchaseRequest, Product, Warehouse } from '../../types/erp';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { formatEgp, formatDate, formatTaxNumber } from '../../utils/formatters';
import { useLanguage } from '../../context/LanguageContext';
import {
  Truck,
  AlertTriangle,
  Plus,
  PackageCheck,
  CheckCircle,
} from 'lucide-react';

export const ProcurementView: React.FC = () => {
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'requests' | 'orders' | 'suppliers'>('requests');

  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);

  // New PO Modal state
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [poSupplierId, setPoSupplierId] = useState('');
  const [poDeliveryDays, setPoDeliveryDays] = useState(14);
  const [poPaymentTerms, setPoPaymentTerms] = useState(
    language === 'en' ? 'Net 30 days from invoice date' : 'سداد خلال 30 يوم من تاريخ الفاتورة'
  );
  const [poNotes, setPoNotes] = useState('');
  const [poItems, setPoItems] = useState<{ productId: string; quantity: number; unitPriceEgp: number }[]>([
    { productId: '', quantity: 100, unitPriceEgp: 50 },
  ]);

  // Goods Receipt Modal state
  const [isGrModalOpen, setIsGrModalOpen] = useState(false);
  const [grSelectedPo, setGrSelectedPo] = useState<PurchaseOrder | null>(null);
  const [grDeliveryNote, setGrDeliveryNote] = useState('');
  const [grLotNumber, setGrLotNumber] = useState('');

  useEffect(() => {
    fetchProcurementData();
  }, []);

  const fetchProcurementData = async () => {
    try {
      setLoading(true);
      const [reqRes, ordRes, supRes, prdRes, whRes] = await Promise.all([
        apiRequest<{ requests: PurchaseRequest[] }>('/procurement/requests'),
        apiRequest<{ orders: PurchaseOrder[] }>('/procurement/orders'),
        apiRequest<{ suppliers: Supplier[] }>('/procurement/suppliers'),
        apiRequest<{ products: Product[] }>('/engineering/products'),
        apiRequest<{ warehouses: Warehouse[] }>('/inventory/warehouses'),
      ]);
      setRequests(reqRes.requests);
      setOrders(ordRes.orders);
      setSuppliers(supRes.suppliers);
      setProducts(prdRes.products.filter((p) => p.category === 'RAW_MATERIAL' || p.category === 'CONSUMABLE'));
      setWarehouses(whRes.warehouses);
      if (supRes.suppliers.length > 0) setPoSupplierId(supRes.suppliers[0].id);
      if (prdRes.products.length > 0) {
        setPoItems([{ productId: prdRes.products[0].id, quantity: 100, unitPriceEgp: prdRes.products[0].standardCostEgp }]);
      }
    } catch (e) {
      console.error('Failed to load procurement data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/procurement/orders', {
        method: 'POST',
        body: JSON.stringify({
          supplierId: poSupplierId,
          expectedDeliveryDays: poDeliveryDays,
          paymentTerms: poPaymentTerms,
          notes: poNotes,
          items: poItems,
        }),
      });
      setIsPoModalOpen(false);
      alert(language === 'en'
        ? 'Purchase Order created! 14% Egyptian VAT and 1% WHT calculated.'
        : 'تم إصدار أمر الشراء للمورد وحساب ضريبة القيمة المضافة 14% وضريبة الخصم 1%!');
      fetchProcurementData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReceiveGoods = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grSelectedPo) return;

    try {
      const itemsToReceive = grSelectedPo.items.map((it) => ({
        purchaseOrderItemId: it.id,
        quantityReceived: it.quantity - it.quantityReceived,
        lotBatchNumber: grLotNumber || `LOT-${Date.now().toString().slice(-6)}`,
      }));

      await apiRequest('/procurement/goods-receipt', {
        method: 'POST',
        body: JSON.stringify({
          purchaseOrderId: grSelectedPo.id,
          warehouseId: warehouses[0]?.id,
          supplierDeliveryNote: grDeliveryNote,
          items: itemsToReceive,
        }),
      });

      setIsGrModalOpen(false);
      alert(language === 'en'
        ? 'Goods receipt registered! Physical inventory updated and shortages cleared.'
        : 'تم تسجيل إذن الاستلام بنجاح، وتحديث أرصدة المخازن وفك أي عجز مرتبط!');
      fetchProcurementData();
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
              {language === 'en' ? 'Procurement & Shortage Engine' : 'المشتريات وسلاسل الإمداد ومحرك العجز MTO'}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              Shortage-Driven
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'en'
              ? 'Automated purchase requisitions triggered by MTO order shortages, Egyptian VAT compliance, and Goods Receipt Notes (GRN).'
              : 'توليد طلبات الشراء تلقائياً بناء على عجز خامات أوامر الإنتاج، ومتابعة فواتير وأذون استلام الموردين'}
          </p>
        </div>

        <button
          onClick={() => setIsPoModalOpen(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'en' ? 'New Purchase Order' : 'إصدار أمر شراء جديد'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'requests' ? 'bg-industrial-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {language === 'en' ? 'Shortage Purchase Requests' : 'طلبات الشراء لعجز خامات الأوامر (MTO)'} ({requests.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'orders' ? 'bg-industrial-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {language === 'en' ? 'Purchase Orders' : 'أوامر الشراء والتوريد'} ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'suppliers' ? 'bg-industrial-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {language === 'en' ? 'Suppliers Directory' : 'سجل الموردين المعتمدين'} ({suppliers.length})
        </button>
      </div>

      {/* TAB 1: SHORTAGE-DRIVEN PURCHASE REQUESTS */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-700" />
              <p className="text-xs text-amber-900 font-semibold">
                {language === 'en'
                  ? 'Purchase requests in this list are generated automatically upon sales order confirmation whenever a shortage against available stock is detected!'
                  : 'طلبات الشراء في هذه القائمة تم توليدها برمجياً وبشكل تلقائي بمجرد تأكيد أمر مبيعات العميل لوجود عجز في رصيد المخزن المتاح!'}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold">
                    <th className="py-3 px-4 text-start">{language === 'en' ? 'Request #' : 'رقم طلب الشراء'}</th>
                    <th className="py-3 px-4 text-start">{language === 'en' ? 'Linked Sales Order' : 'أمر المبيعات المرتبط'}</th>
                    <th className="py-3 px-4 text-start">{language === 'en' ? 'Required Material' : 'الخامة المطلوبة'}</th>
                    <th className="py-3 px-4 text-end">{language === 'en' ? 'Quantity' : 'الكمية المطلوبة'}</th>
                    <th className="py-3 px-4 text-start">{language === 'en' ? 'Reason' : 'سبب الطلب'}</th>
                    <th className="py-3 px-4 text-center">{language === 'en' ? 'Priority' : 'الأولوية'}</th>
                    <th className="py-3 px-4 text-center">{t.status}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.map((pr) => {
                    const custName = language === 'en' ? (pr.salesOrder?.customer?.nameEn || pr.salesOrder?.customer?.nameAr) : pr.salesOrder?.customer?.nameAr;
                    const matName = pr.items?.[0]?.product ? (language === 'en' ? (pr.items[0].product.nameEn || pr.items[0].product.nameAr) : pr.items[0].product.nameAr) : '-';
                    return (
                      <tr key={pr.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{pr.requestNumber}</td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                          {pr.salesOrder ? `${pr.salesOrder.orderNumber} (${custName})` : (language === 'en' ? 'General' : 'طلب عام')}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">{matName}</td>
                        <td className="py-3.5 px-4 text-end font-mono font-bold text-rose-700">
                          {pr.items?.[0]?.quantity} {pr.items?.[0]?.product.unit}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 max-w-xs">{pr.reason}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">
                            {pr.priority}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <Badge status={pr.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PURCHASE ORDERS */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold">
                  <th className="py-3 px-4 text-start">{language === 'en' ? 'PO #' : 'رقم أمر الشراء'}</th>
                  <th className="py-3 px-4 text-start">{t.supplier}</th>
                  <th className="py-3 px-4 text-start">{language === 'en' ? 'Items' : 'الأصناف'}</th>
                  <th className="py-3 px-4 text-start">{language === 'en' ? 'Expected Delivery' : 'تاريخ التوريد المتوقع'}</th>
                  <th className="py-3 px-4 text-end">{language === 'en' ? 'Total (14% VAT)' : 'الإجمالي شامل 14% ض.ق.م'}</th>
                  <th className="py-3 px-4 text-center">{t.status}</th>
                  <th className="py-3 px-4 text-center">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((po) => {
                  const supName = language === 'en' ? (po.supplier.nameEn || po.supplier.nameAr) : po.supplier.nameAr;
                  return (
                    <tr key={po.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{po.poNumber}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{supName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {language === 'en' ? 'Tax Reg:' : 'بطاقة ضريبية:'} {formatTaxNumber(po.supplier.taxRegistrationNo)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {po.items?.map((it, idx) => {
                          const prdName = language === 'en' ? (it.product.nameEn || it.product.nameAr) : it.product.nameAr;
                          return (
                            <div key={idx} className="text-slate-700">
                              <span className="font-semibold">{it.quantity} {it.product.unit}</span> - {prdName}
                            </div>
                          );
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{formatDate(po.expectedDeliveryDate, language)}</td>
                      <td className="py-3.5 px-4 text-end font-bold text-slate-900">{formatEgp(po.totalAmountEgp, language)}</td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge status={po.status} />
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {po.status !== 'COMPLETED' ? (
                          <button
                            onClick={() => {
                              setGrSelectedPo(po);
                              setGrLotNumber(`LOT-${Date.now().toString().slice(-6)}`);
                              setIsGrModalOpen(true);
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 mx-auto shadow-sm"
                          >
                            <PackageCheck className="w-3.5 h-3.5" />
                            <span>{language === 'en' ? 'Receive (GRN)' : 'تسجيل استلام (GRN)'}</span>
                          </button>
                        ) : (
                          <span className="text-emerald-700 font-bold flex items-center justify-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            <span>{language === 'en' ? 'Received' : 'تم الاستلام'}</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SUPPLIERS */}
      {activeTab === 'suppliers' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold">
                  <th className="py-3 px-4 text-start">{language === 'en' ? 'Supplier Code' : 'كود المورد'}</th>
                  <th className="py-3 px-4 text-start">{language === 'en' ? 'Company Name' : 'اسم شركة التوريد'}</th>
                  <th className="py-3 px-4 text-start">{language === 'en' ? 'Tax Card #' : 'البطاقة الضريبية'}</th>
                  <th className="py-3 px-4 text-start">{language === 'en' ? 'Category' : 'التصنيف'}</th>
                  <th className="py-3 px-4 text-start">{language === 'en' ? 'Contact Person' : 'مسؤول المبيعات'}</th>
                  <th className="py-3 px-4 text-end">{language === 'en' ? 'Rating' : 'التقييم'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {suppliers.map((s) => {
                  const sName = language === 'en' ? (s.nameEn || s.nameAr) : s.nameAr;
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{s.code}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{sName}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">{formatTaxNumber(s.taxRegistrationNo)}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800">
                          {s.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">{s.contactPerson || '-'}</td>
                      <td className="py-3.5 px-4 text-end font-bold text-amber-600">★ {s.rating}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: NEW PURCHASE ORDER */}
      <Modal
        isOpen={isPoModalOpen}
        onClose={() => setIsPoModalOpen(false)}
        title={language === 'en' ? 'Create New Purchase Order' : 'إصدار أمر شراء خامات جديد'}
        subtitle={language === 'en' ? 'Calculates 14% Egyptian VAT and 1% WHT' : 'حساب ضريبة القيمة المضافة 14% وضريبة الخصم والإضافة 1%'}
        maxWidth="xl"
      >
        <form onSubmit={handleCreatePo} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'en' ? 'Supplier *' : 'المورد *'}
              </label>
              <select
                value={poSupplierId}
                onChange={(e) => setPoSupplierId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {language === 'en' ? (s.nameEn || s.nameAr) : s.nameAr}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'en' ? 'Expected Delivery (Days)' : 'فترة التوريد المتوقعة (أيام)'}
              </label>
              <input
                type="number"
                value={poDeliveryDays}
                onChange={(e) => setPoDeliveryDays(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
              />
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
            <span className="font-bold text-slate-900">
              {language === 'en' ? 'Raw Material Line' : 'الخامة المراد شراؤها'}
            </span>
            <div className="grid grid-cols-12 gap-2 bg-white p-2.5 rounded-lg border border-slate-200 items-center">
              <div className="col-span-6">
                <label className="block text-[11px] text-slate-500 mb-0.5">
                  {language === 'en' ? 'Material' : 'الخامة'}
                </label>
                <select
                  value={poItems[0].productId}
                  onChange={(e) => {
                    const p = products.find((x) => x.id === e.target.value);
                    setPoItems([{ ...poItems[0], productId: e.target.value, unitPriceEgp: p?.standardCostEgp || 50 }]);
                  }}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {language === 'en' ? (p.nameEn || p.nameAr) : p.nameAr} ({p.unit})
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-3">
                <label className="block text-[11px] text-slate-500 mb-0.5">
                  {language === 'en' ? 'Quantity' : 'الكمية'}
                </label>
                <input
                  type="number"
                  value={poItems[0].quantity}
                  onChange={(e) => setPoItems([{ ...poItems[0], quantity: Number(e.target.value) }])}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>
              <div className="col-span-3">
                <label className="block text-[11px] text-slate-500 mb-0.5">
                  {language === 'en' ? 'Unit Price (EGP)' : 'سعر الوحدة (ج.م)'}
                </label>
                <input
                  type="number"
                  value={poItems[0].unitPriceEgp}
                  onChange={(e) => setPoItems([{ ...poItems[0], unitPriceEgp: Number(e.target.value) }])}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {language === 'en' ? 'Payment Terms' : 'شروط السداد'}
            </label>
            <input
              type="text"
              value={poPaymentTerms}
              onChange={(e) => setPoPaymentTerms(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsPoModalOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm"
            >
              {language === 'en' ? 'Confirm Purchase Order' : 'اعتماد وإرسال أمر الشراء'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: GOODS RECEIPT (GRN) */}
      <Modal
        isOpen={isGrModalOpen}
        onClose={() => setIsGrModalOpen(false)}
        title={language === 'en' ? 'Goods Receipt Note (GRN)' : 'إذن استلام خامات بمخزن العاشر من رمضان (GRN)'}
        subtitle={grSelectedPo?.poNumber || ''}
      >
        <form onSubmit={handleReceiveGoods} className="space-y-4 text-xs">
          <div>
            <p className="text-slate-600 mb-1">
              {language === 'en' ? 'Supplier:' : 'المورد:'} <span className="font-bold text-slate-900">{language === 'en' ? (grSelectedPo?.supplier.nameEn || grSelectedPo?.supplier.nameAr) : grSelectedPo?.supplier.nameAr}</span>
            </p>
            <p className="text-slate-600 mb-3">
              {language === 'en' ? 'PO Number:' : 'أمر الشراء:'} <span className="font-mono font-bold text-slate-900">{grSelectedPo?.poNumber}</span>
            </p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {language === 'en' ? 'Supplier Delivery Note / Invoice #' : 'رقم إذن توريد المورد أو الفاتورة *'}
            </label>
            <input
              type="text"
              required
              value={grDeliveryNote}
              onChange={(e) => setGrDeliveryNote(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="DN-2026-9812"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {language === 'en' ? 'Batch / Lot Number' : 'رقم تشغيلة الشحنة (Lot / Batch Number)'}
            </label>
            <input
              type="text"
              value={grLotNumber}
              onChange={(e) => setGrLotNumber(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsGrModalOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm"
            >
              {language === 'en' ? 'Confirm Receipt & Update Stock' : 'اعتماد الاستلام وتحديث المخزن'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
