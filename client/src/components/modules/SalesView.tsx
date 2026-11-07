import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { Customer, Quotation, SalesOrder, Product } from '../../types/erp';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { formatEgp, formatDate, formatTaxNumber } from '../../utils/formatters';
import { useLanguage } from '../../context/LanguageContext';
import {
  ShoppingBag,
  Users,
  FileText,
  Plus,
  CheckCircle,
} from 'lucide-react';

export const SalesView: React.FC = () => {
  const { language, isRtl, t } = useLanguage();
  const [activeSubTab, setActiveSubTab] = useState<'orders' | 'quotations' | 'customers'>('orders');

  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  // New Order Form state
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [orderDeliveryDays, setOrderDeliveryDays] = useState(30);
  const [orderAdvancePayment, setOrderAdvancePayment] = useState(0);
  const [orderPaymentTerms, setOrderPaymentTerms] = useState(
    language === 'en' ? '50% advance, balance on delivery' : '50% دفعة مقدمة والباقي بعد الاستلام'
  );
  const [orderNotes, setOrderNotes] = useState('');
  const [orderItems, setOrderItems] = useState<{ productId: string; quantity: number; unitPriceEgp: number; customSpecs?: string }[]>([
    { productId: '', quantity: 1, unitPriceEgp: 0, customSpecs: '' },
  ]);

  // New Customer Form state
  const [customerForm, setCustomerForm] = useState({
    nameAr: '',
    nameEn: '',
    taxRegistrationNo: '',
    commercialRegNo: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    city: 'Cairo',
    governorate: 'Cairo',
    paymentTermsDays: 30,
    creditLimitEgp: 500000,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordRes, quoRes, custRes, prdRes] = await Promise.all([
        apiRequest<{ orders: SalesOrder[] }>('/sales/orders'),
        apiRequest<{ quotations: Quotation[] }>('/sales/quotations'),
        apiRequest<{ customers: Customer[] }>('/sales/customers'),
        apiRequest<{ products: Product[] }>('/engineering/products'),
      ]);
      setOrders(ordRes.orders);
      setQuotations(quoRes.quotations);
      setCustomers(custRes.customers);
      setProducts(prdRes.products.filter((p) => p.category === 'FINISHED_PRODUCT'));
      if (custRes.customers.length > 0) setSelectedCustomerId(custRes.customers[0].id);
      if (prdRes.products.length > 0) {
        setOrderItems([{ productId: prdRes.products[0].id, quantity: 1, unitPriceEgp: prdRes.products[0].sellingPriceEgp, customSpecs: '' }]);
      }
    } catch (e) {
      console.error('Failed to load sales data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/sales/customers', {
        method: 'POST',
        body: JSON.stringify(customerForm),
      });
      setIsCustomerModalOpen(false);
      setCustomerForm({
        nameAr: '',
        nameEn: '',
        taxRegistrationNo: '',
        commercialRegNo: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        city: 'Cairo',
        governorate: 'Cairo',
        paymentTermsDays: 30,
        creditLimitEgp: 500000,
      });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateSalesOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/sales/orders', {
        method: 'POST',
        body: JSON.stringify({
          customerId: selectedCustomerId,
          deliveryDays: orderDeliveryDays,
          advancePaymentEgp: orderAdvancePayment,
          paymentTerms: orderPaymentTerms,
          notes: orderNotes,
          items: orderItems,
        }),
      });
      setIsOrderModalOpen(false);
      alert(language === 'en'
        ? 'Sales Order confirmed! MTO engine triggered BOM explosion and material reservation.'
        : 'تم تأكيد أمر المبيعات وتوليد أمر الإنتاج وحجز الخامات تلقائياً وفق دورة MTO!');
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const addOrderItem = () => {
    if (products.length > 0) {
      setOrderItems([...orderItems, { productId: products[0].id, quantity: 1, unitPriceEgp: products[0].sellingPriceEgp, customSpecs: '' }]);
    }
  };

  const removeOrderItem = (index: number) => {
    if (orderItems.length > 1) {
      setOrderItems(orderItems.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">
              {language === 'en' ? 'CRM & Make-To-Order Sales Orders' : 'إدارة المبيعات وعقود التصنيع MTO'}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              MTO Source
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'en'
              ? 'Confirmed sales orders automatically trigger BOM explosion, inventory reservation, and shop-floor job cards.'
              : 'تأكيد أوامر البيع يُطلق تلقائياً دورة تفجير شجرة المنتج (BOM Explosion) وتخصيص الخامات'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCustomerModalOpen(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Users className="w-4 h-4 text-slate-600" />
            <span>{language === 'en' ? 'Add Customer' : 'إضافة عميل'}</span>
          </button>
          <button
            onClick={() => setIsOrderModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'en' ? 'New MTO Sales Order' : 'تأكيد أمر تصنيع جديد'}</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs Pill Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('orders')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'orders'
              ? 'bg-industrial-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {language === 'en' ? 'Confirmed Sales Orders (MTO)' : 'أوامر المبيعات المؤكدة (MTO)'} ({orders.length})
        </button>
        <button
          onClick={() => setActiveSubTab('quotations')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'quotations'
              ? 'bg-industrial-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {language === 'en' ? 'Quotations' : 'عروض الأسعار'} ({quotations.length})
        </button>
        <button
          onClick={() => setActiveSubTab('customers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'customers'
              ? 'bg-industrial-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {language === 'en' ? 'Customer Directory' : 'دليل العملاء والشركات'} ({customers.length})
        </button>
      </div>

      {/* TAB 1: CONFIRMED SALES ORDERS */}
      {activeSubTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold">
                  <th className="py-3 px-4 text-start">{language === 'en' ? 'Order #' : 'رقم الأمر'}</th>
                  <th className="py-3 px-4 text-start">{t.customer}</th>
                  <th className="py-3 px-4 text-start">{language === 'en' ? 'Ordered Products' : 'المنتجات المطلوبة'}</th>
                  <th className="py-3 px-4 text-start">{language === 'en' ? 'Delivery Due' : 'تاريخ التسليم'}</th>
                  <th className="py-3 px-4 text-end">{language === 'en' ? 'Total (incl. 14% VAT)' : 'الإجمالي (شامل 14% ض.ق.م)'}</th>
                  <th className="py-3 px-4 text-center">{language === 'en' ? 'Production Trace' : 'أمر الإنتاج المرتبط'}</th>
                  <th className="py-3 px-4 text-center">{t.status}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((so) => {
                  const custName = language === 'en' ? (so.customer.nameEn || so.customer.nameAr) : so.customer.nameAr;
                  return (
                    <tr key={so.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{so.orderNumber}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{custName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {language === 'en' ? 'Tax Card:' : 'بطاقة ضريبية:'} {formatTaxNumber(so.customer.taxRegistrationNo)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {so.items?.map((it, idx) => {
                          const prdName = language === 'en' ? (it.product.nameEn || it.product.nameAr) : it.product.nameAr;
                          return (
                            <div key={idx} className="text-slate-700">
                              <span className="font-semibold">{it.quantity} {language === 'en' ? 'units' : 'وحدة'}</span> - {prdName}
                            </div>
                          );
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {formatDate(so.deliveryDeadline, language)}
                      </td>
                      <td className="py-3.5 px-4 text-end font-bold text-slate-900">
                        {formatEgp(so.totalAmountEgp, language)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {so.productionOrders && so.productionOrders.length > 0 ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-mono font-bold">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{so.productionOrders[0].orderNumber}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-medium">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge status={so.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: QUOTATIONS */}
      {activeSubTab === 'quotations' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold">
                  <th className="py-3 px-4 text-start">{language === 'en' ? 'Quote #' : 'رقم العرض'}</th>
                  <th className="py-3 px-4 text-start">{t.customer}</th>
                  <th className="py-3 px-4 text-start">{language === 'en' ? 'Valid Until' : 'تاريخ الصلاحية'}</th>
                  <th className="py-3 px-4 text-end">{language === 'en' ? 'Subtotal' : 'قيمة العرض قبل الضريبة'}</th>
                  <th className="py-3 px-4 text-end">{language === 'en' ? 'Total (14% VAT)' : 'إجمالي شامل 14% ض.ق.م'}</th>
                  <th className="py-3 px-4 text-center">{t.status}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quotations.map((q) => {
                  const custName = language === 'en' ? (q.customer.nameEn || q.customer.nameAr) : q.customer.nameAr;
                  return (
                    <tr key={q.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{q.quoteNumber}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-900">{custName}</td>
                      <td className="py-3.5 px-4 text-slate-600">{formatDate(q.validUntil, language)}</td>
                      <td className="py-3.5 px-4 text-end font-mono text-slate-700">{formatEgp(q.subtotalEgp, language)}</td>
                      <td className="py-3.5 px-4 text-end font-bold text-emerald-800">{formatEgp(q.totalAmountEgp, language)}</td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge status={q.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CUSTOMERS */}
      {activeSubTab === 'customers' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold">
                  <th className="py-3 px-4 text-start">{language === 'en' ? 'Code' : 'كود العميل'}</th>
                  <th className="py-3 px-4 text-start">{language === 'en' ? 'Company Name' : 'اسم الشركة / المنشأة'}</th>
                  <th className="py-3 px-4 text-start">{language === 'en' ? 'Tax Card #' : 'البطاقة الضريبية'}</th>
                  <th className="py-3 px-4 text-start">{language === 'en' ? 'Commercial Reg #' : 'السجل التجاري'}</th>
                  <th className="py-3 px-4 text-start">{language === 'en' ? 'Contact Person' : 'مسؤول الاتصال'}</th>
                  <th className="py-3 px-4 text-start">{language === 'en' ? 'City' : 'المدينة'}</th>
                  <th className="py-3 px-4 text-end">{language === 'en' ? 'Payment Terms' : 'فترة السداد'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => {
                  const cName = language === 'en' ? (c.nameEn || c.nameAr) : c.nameAr;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{c.code}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{cName}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">{formatTaxNumber(c.taxRegistrationNo)}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">{c.commercialRegNo || '-'}</td>
                      <td className="py-3.5 px-4 text-slate-700">{c.contactPerson || '-'}</td>
                      <td className="py-3.5 px-4 text-slate-600">{c.city}</td>
                      <td className="py-3.5 px-4 text-end font-semibold text-slate-900">
                        {c.paymentTermsDays} {language === 'en' ? 'days' : 'يوم'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD CUSTOMER */}
      <Modal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title={language === 'en' ? 'Add New Egyptian Customer' : 'إضافة عميل / شركة مصرية جديدة'}
        subtitle={language === 'en' ? 'Register official tax and commercial details' : 'تسجيل البيانات الضريبية والتجارية المعتمدة'}
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {language === 'en' ? 'Company Name (English) *' : 'اسم المنشأة بالعربية *'}
            </label>
            <input
              type="text"
              required
              value={language === 'en' ? customerForm.nameEn : customerForm.nameAr}
              onChange={(e) => {
                if (language === 'en') {
                  setCustomerForm({ ...customerForm, nameEn: e.target.value, nameAr: customerForm.nameAr || e.target.value });
                } else {
                  setCustomerForm({ ...customerForm, nameAr: e.target.value, nameEn: customerForm.nameEn || e.target.value });
                }
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder={language === 'en' ? 'e.g. Nile Engineering Industries S.A.E.' : 'مثال: شركة النيل للصناعات الهندسية ش.م.م'}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'en' ? 'Tax Card (9 Digits)' : 'رقم البطاقة الضريبية'}
              </label>
              <input
                type="text"
                value={customerForm.taxRegistrationNo}
                onChange={(e) => setCustomerForm({ ...customerForm, taxRegistrationNo: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                placeholder="100-245-892"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'en' ? 'Commercial Reg #' : 'رقم السجل التجاري'}
              </label>
              <input
                type="text"
                value={customerForm.commercialRegNo}
                onChange={(e) => setCustomerForm({ ...customerForm, commercialRegNo: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                placeholder="45892"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'en' ? 'Contact Person' : 'مسؤول الاتصال'}
              </label>
              <input
                type="text"
                value={customerForm.contactPerson}
                onChange={(e) => setCustomerForm({ ...customerForm, contactPerson: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'en' ? 'Phone Number' : 'رقم الهاتف'}
              </label>
              <input
                type="text"
                value={customerForm.phone}
                onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                placeholder="+20 100 000 0000"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'en' ? 'Industrial Zone / City' : 'المدينة والمنطقة الصناعية'}
              </label>
              <input
                type="text"
                value={customerForm.city}
                onChange={(e) => setCustomerForm({ ...customerForm, city: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'en' ? 'Credit Terms (Days)' : 'فترة الائتمان (أيام)'}
              </label>
              <input
                type="number"
                value={customerForm.paymentTermsDays}
                onChange={(e) => setCustomerForm({ ...customerForm, paymentTermsDays: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsCustomerModalOpen(false)}
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

      {/* MODAL: NEW MTO SALES ORDER */}
      <Modal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        title={language === 'en' ? 'Confirm MTO Sales Order' : 'تأكيد أمر مبيعات جديد (إطلاق تصنيع MTO)'}
        subtitle={language === 'en' ? 'Directly triggers BOM explosion and material reservation' : 'يقوم النظام بحساب متطلبات الخامات وحجزها فورياً'}
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateSalesOrder} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'en' ? 'Customer *' : 'العميل *'}
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {language === 'en' ? (c.nameEn || c.nameAr) : c.nameAr}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'en' ? 'Delivery Deadline (Days)' : 'فترة التوريد المستهدفة (أيام)'}
              </label>
              <input
                type="number"
                value={orderDeliveryDays}
                onChange={(e) => setOrderDeliveryDays(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Items Section */}
          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">
                {language === 'en' ? 'Custom Manufactured Products' : 'بنود المنتجات المخصصة للتصنيع'}
              </span>
              <button
                type="button"
                onClick={addOrderItem}
                className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 flex items-center gap-1 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Add Item' : 'إضافة بند'}</span>
              </button>
            </div>

            {orderItems.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 bg-white p-2.5 rounded-xl border border-slate-200 items-center">
                <div className="col-span-6">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                    {language === 'en' ? 'Product' : 'المنتج الهندسي'}
                  </label>
                  <select
                    value={item.productId}
                    onChange={(e) => {
                      const p = products.find((x) => x.id === e.target.value);
                      const updated = [...orderItems];
                      updated[idx].productId = e.target.value;
                      if (p) updated[idx].unitPriceEgp = p.sellingPriceEgp;
                      setOrderItems(updated);
                    }}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {language === 'en' ? (p.nameEn || p.nameAr) : p.nameAr} ({p.itemCode})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                    {language === 'en' ? 'Quantity' : 'الكمية'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => {
                      const updated = [...orderItems];
                      updated[idx].quantity = Number(e.target.value);
                      setOrderItems(updated);
                    }}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                    {language === 'en' ? 'Unit Price (EGP)' : 'سعر الوحدة (ج.م)'}
                  </label>
                  <input
                    type="number"
                    value={item.unitPriceEgp}
                    onChange={(e) => {
                      const updated = [...orderItems];
                      updated[idx].unitPriceEgp = Number(e.target.value);
                      setOrderItems(updated);
                    }}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div className="col-span-1 text-center pt-4">
                  {orderItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeOrderItem(idx)}
                      className="text-rose-600 hover:text-rose-800 font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'en' ? 'Advance Payment (EGP)' : 'الدفعة المقدمة المدفوعة (ج.م)'}
              </label>
              <input
                type="number"
                value={orderAdvancePayment}
                onChange={(e) => setOrderAdvancePayment(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'en' ? 'Payment Terms' : 'شروط السداد والدفعات'}
              </label>
              <input
                type="text"
                value={orderPaymentTerms}
                onChange={(e) => setOrderPaymentTerms(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs">
            <span className="font-bold">{language === 'en' ? 'MTO Rule:' : 'ملاحظة نظام MTO:'}</span>{' '}
            {language === 'en'
              ? 'Confirming this order initiates automatic BOM explosion, locks stock reservations in the 10th of Ramadan plant, and triggers urgent purchase requisitions for shortages.'
              : 'الضغط على تأكيد وإطلاق أمر الإنتاج سيقوم تلقائياً بتفجير شجرة المنتج (BOM)، فحص أرصدة مخزن العاشر من رمضان، حجز الخامات المتاحة، وتوليد طلب شراء عاجل في حال وجود أي عجز!'}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsOrderModalOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{language === 'en' ? 'Confirm & Trigger MTO Job' : 'تأكيد وإطلاق أمر الإنتاج MTO'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
