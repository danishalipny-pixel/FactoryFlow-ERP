import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { Invoice, Payment, ProductionOrder } from '../../types/erp';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { formatEgp, formatDate, formatTaxNumber } from '../../utils/formatters';
import { useLanguage } from '../../context/LanguageContext';
import {
  Receipt,
  Send,
  FileCode2,
} from 'lucide-react';

export const FinanceView: React.FC = () => {
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'invoices' | 'costing' | 'coa'>('invoices');

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ETA Inspector Modal
  const [etaPayload, setEtaPayload] = useState<any>(null);
  const [selectedInvoiceForEta, setSelectedInvoiceForEta] = useState<Invoice | null>(null);

  // Order Costing Modal
  const [costingData, setCostingData] = useState<any>(null);

  // Payment Modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payInvoiceId, setPayInvoiceId] = useState('');
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState('BANK_TRANSFER');
  const [payRef, setPayRef] = useState('');
  const [payBank, setPayBank] = useState('National Bank of Egypt (NBE)');

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      const [invRes, ordRes, coaRes] = await Promise.all([
        apiRequest<{ invoices: Invoice[] }>('/finance/invoices'),
        apiRequest<{ orders: ProductionOrder[] }>('/production/orders'),
        apiRequest<{ accounts: any[] }>('/finance/chart-of-accounts'),
      ]);
      setInvoices(invRes.invoices);
      setOrders(ordRes.orders);
      setAccounts(coaRes.accounts);
    } catch (e) {
      console.error('Failed to load finance data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleInspectEta = async (invoice: Invoice) => {
    try {
      setSelectedInvoiceForEta(invoice);
      const res = await apiRequest(`/finance/invoices/${invoice.id}/eta-payload`);
      setEtaPayload(res.etaDocument);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSubmitEta = async (invoiceId: string) => {
    try {
      const res = await apiRequest(`/finance/invoices/${invoiceId}/submit-eta`, {
        method: 'POST',
      });
      alert(language === 'en'
        ? `Invoice verified and registered with ETA! (UUID: ${res.etaUuid})`
        : `✅ ${res.message} (معرف الفاتورة: ${res.etaUuid})`);
      setEtaPayload(null);
      setSelectedInvoiceForEta(null);
      fetchFinanceData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleViewCosting = async (orderId: string) => {
    try {
      const res = await apiRequest(`/finance/order-costing/${orderId}`);
      setCostingData(res);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/finance/payments', {
        method: 'POST',
        body: JSON.stringify({
          invoiceId: payInvoiceId,
          amountEgp: payAmount,
          paymentMethod: payMethod,
          referenceNumber: payRef,
          bankName: payBank,
        }),
      });
      setIsPayModalOpen(false);
      alert(language === 'en'
        ? 'Payment receipt recorded and invoice status updated!'
        : 'تم تسجيل سند القبض وتحديث حالة سداد الفاتورة بنجاح!');
      fetchFinanceData();
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
              {language === 'en' ? 'Finance, Cost Accounting & ETA E-Invoicing' : 'الإدارة المالية وحسابات التكاليف والفاتورة الإلكترونية'}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              ETA v1.0 Certified Architecture
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'en'
              ? 'Egyptian Tax Authority compliant e-invoicing (14% VAT & 1% WHT) and actual job order costing.'
              : 'جاهزية الربط مع مصلحة الضرائب المصرية (ضريبة 14% وخصم 1%) واحتساب التكاليف الفعلية للأوامر'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'invoices' ? 'bg-industrial-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {language === 'en' ? 'Tax Invoices & ETA Status' : 'الفواتير الضريبية ومنظومة الضرائب'} ({invoices.length})
        </button>
        <button
          onClick={() => setActiveTab('costing')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'costing' ? 'bg-industrial-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {language === 'en' ? 'Order Costing & Margin' : 'تحليل التكاليف وهامش ربح الأوامر'} ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('coa')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'coa' ? 'bg-industrial-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {language === 'en' ? 'Egyptian Chart of Accounts (COA)' : 'دليل الحسابات المصري (COA)'} ({accounts.length})
        </button>
      </div>

      {/* TAB 1: INVOICES & ETA STATUS */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold">
                  <th className="py-3 px-4 text-start">{language === 'en' ? 'Invoice #' : 'رقم الفاتورة'}</th>
                  <th className="py-3 px-4 text-start">{t.customer}</th>
                  <th className="py-3 px-4 text-start">{language === 'en' ? 'Issue Date' : 'تاريخ الإصدار'}</th>
                  <th className="py-3 px-4 text-end">{language === 'en' ? 'Subtotal' : 'المبلغ قبل الضريبة'}</th>
                  <th className="py-3 px-4 text-end">{language === 'en' ? 'VAT (14%)' : 'ضريبة ق.م (14%)'}</th>
                  <th className="py-3 px-4 text-end">{language === 'en' ? 'WHT (1%)' : 'ضريبة خصم (1%)'}</th>
                  <th className="py-3 px-4 text-end">{language === 'en' ? 'Total (EGP)' : 'الإجمالي النهائي'}</th>
                  <th className="py-3 px-4 text-center">{language === 'en' ? 'Payment' : 'حالة السداد'}</th>
                  <th className="py-3 px-4 text-center">{language === 'en' ? 'ETA Status' : 'الفاتورة الإلكترونية ETA'}</th>
                  <th className="py-3 px-4 text-center">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => {
                  const custName = language === 'en' ? (inv.customer.nameEn || inv.customer.nameAr) : inv.customer.nameAr;
                  const etaLabel = inv.etaSubmissionStatus === 'Valid'
                    ? (language === 'en' ? 'Valid (ETA)' : 'معتمدة بالضرائب')
                    : (language === 'en' ? 'Not Submitted' : 'غير مرسلة');

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{custName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {language === 'en' ? 'Tax Card:' : 'بطاقة ضريبية:'} {formatTaxNumber(inv.customer.taxRegistrationNo)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{formatDate(inv.issueDate, language)}</td>
                      <td className="py-3.5 px-4 text-end font-mono text-slate-700">{formatEgp(inv.subtotalEgp, language)}</td>
                      <td className="py-3.5 px-4 text-end font-mono text-slate-700">{formatEgp(inv.vatAmountEgp, language)}</td>
                      <td className="py-3.5 px-4 text-end font-mono text-rose-700">-{formatEgp(inv.whtAmountEgp, language)}</td>
                      <td className="py-3.5 px-4 text-end font-mono font-bold text-slate-900">{formatEgp(inv.totalAmountEgp, language)}</td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge status={inv.paymentStatus} />
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          inv.etaSubmissionStatus === 'Valid'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}>
                          {etaLabel}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleInspectEta(inv)}
                            className="px-2.5 py-1 bg-industrial-900 hover:bg-industrial-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                          >
                            <FileCode2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{language === 'en' ? 'ETA JSON' : 'هيكل ETA'}</span>
                          </button>
                          {inv.paymentStatus !== 'PAID' && (
                            <button
                              onClick={() => {
                                setPayInvoiceId(inv.id);
                                setPayAmount(inv.totalAmountEgp - inv.paidAmountEgp);
                                setIsPayModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                            >
                              {language === 'en' ? 'Payment' : 'سند قبض'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ORDER COSTING BREAKDOWN */}
      {activeTab === 'costing' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-xs">
              {language === 'en'
                ? 'Actual Order Costing (Direct Materials + Direct Labor + Overheads)'
                : 'حساب التكلفة الفعلية للأوامر (Direct Materials + Direct Labor + Overheads)'}
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-white">
                  <th className="py-3 px-4 text-start">{language === 'en' ? 'Job #' : 'أمر الإنتاج'}</th>
                  <th className="py-3 px-4 text-start">{language === 'en' ? 'Customer & Sales Order' : 'أمر المبيعات والعميل'}</th>
                  <th className="py-3 px-4 text-end">{language === 'en' ? 'Actual Materials' : 'تكلفة الخامات الفعلية'}</th>
                  <th className="py-3 px-4 text-end">{language === 'en' ? 'Actual Labor' : 'تكلفة الأجور الفعلية'}</th>
                  <th className="py-3 px-4 text-end">{language === 'en' ? 'Machine Overhead' : 'استهلاك الماكينات والمصنع'}</th>
                  <th className="py-3 px-4 text-end">{language === 'en' ? 'Total Cost (COGS)' : 'إجمالي تكلفة الصنع (COGS)'}</th>
                  <th className="py-3 px-4 text-center">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((po) => {
                  const custName = language === 'en' ? (po.salesOrder?.customer?.nameEn || po.salesOrder?.customer?.nameAr) : po.salesOrder?.customer?.nameAr;
                  return (
                    <tr key={po.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{po.orderNumber}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{custName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{po.salesOrder?.orderNumber}</div>
                      </td>
                      <td className="py-3.5 px-4 text-end font-mono text-slate-800">{formatEgp(po.actualMaterialCostEgp, language)}</td>
                      <td className="py-3.5 px-4 text-end font-mono text-slate-800">{formatEgp(po.actualLaborCostEgp, language)}</td>
                      <td className="py-3.5 px-4 text-end font-mono text-slate-800">{formatEgp(po.actualOverheadCostEgp, language)}</td>
                      <td className="py-3.5 px-4 text-end font-mono font-bold text-emerald-800 bg-emerald-50/40">
                        {formatEgp(po.totalActualCostEgp, language)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleViewCosting(po.id)}
                          className="px-3 py-1 bg-industrial-900 hover:bg-industrial-800 text-white rounded-lg text-xs font-semibold"
                        >
                          {language === 'en' ? 'Costing Details' : 'تحليل تفصيلي'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CHART OF ACCOUNTS */}
      {activeTab === 'coa' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold">
                  <th className="py-3 px-4 text-start">{language === 'en' ? 'Account Code' : 'كود الحساب'}</th>
                  <th className="py-3 px-4 text-start">{language === 'en' ? 'Account Name' : 'اسم الحساب'}</th>
                  <th className="py-3 px-4 text-start">{language === 'en' ? 'Account Reference' : 'الاسم بالإنجليزية'}</th>
                  <th className="py-3 px-4 text-center">{language === 'en' ? 'Account Type' : 'طبيعة الحساب'}</th>
                  <th className="py-3 px-4 text-end">{language === 'en' ? 'Current Balance' : 'الرصيد الدفتري الحالي'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accounts.map((acc) => {
                  const accName = language === 'en' ? (acc.nameEn || acc.nameAr) : acc.nameAr;
                  return (
                    <tr key={acc.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{acc.accountCode}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{accName}</td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono">{acc.nameEn}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800">
                          {acc.accountType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-end font-mono font-bold text-slate-900">
                        {formatEgp(acc.balanceEgp, language)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ETA E-INVOICE PAYLOAD INSPECTOR */}
      <Modal
        isOpen={Boolean(etaPayload)}
        onClose={() => setEtaPayload(null)}
        title={language === 'en' ? 'Egyptian Tax Authority (ETA v1.0) E-Invoice Payload' : 'هيكل وثيقة الفاتورة الإلكترونية لمنظومة الضرائب المصرية (ETA v1.0)'}
        subtitle={selectedInvoiceForEta ? `${selectedInvoiceForEta.invoiceNumber} | UUID: ${selectedInvoiceForEta.etaUuid}` : ''}
        maxWidth="4xl"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-900">
            <div>
              <span className="font-bold">{language === 'en' ? 'Specification Standard:' : 'المعايير المطبقة:'}</span>{' '}
              {language === 'en'
                ? 'Valid ETA v1.0 JSON document payload conforming to Egyptian e-invoicing standards (EGS coding, VAT category T1, and WHT category T4).'
                : 'وثيقة JSON متوافقة 100% مع مواصفات منظومة الفاتورة الإلكترونية بمصلحة الضرائب المصرية.'}
            </div>
            {selectedInvoiceForEta?.etaSubmissionStatus !== 'Valid' && (
              <button
                onClick={() => selectedInvoiceForEta && handleSubmitEta(selectedInvoiceForEta.id)}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold flex items-center gap-1.5 shrink-0 shadow-sm"
              >
                <Send className="w-4 h-4" />
                <span>{language === 'en' ? 'Submit to ETA' : 'إرسال واعتماد بالمنظومة'}</span>
              </button>
            )}
          </div>

          <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-[11px] overflow-x-auto max-h-[55vh]">
            <pre>{JSON.stringify(etaPayload, null, 2)}</pre>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setEtaPayload(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
            >
              {language === 'en' ? 'Close' : 'إغلاق'}
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: DETAILED ORDER COSTING */}
      <Modal
        isOpen={Boolean(costingData)}
        onClose={() => setCostingData(null)}
        title={language === 'en' ? 'Manufacturing Job Costing Breakdown' : 'التحليل التفصيلي لتكلفة أمر التصنيع'}
        subtitle={costingData ? `${costingData.orderNumber} - ${costingData.productName}` : ''}
        maxWidth="2xl"
      >
        {costingData && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-slate-500 font-semibold">{language === 'en' ? 'Contract Revenue' : 'إيراد البيع'}</span>
                <p className="text-base font-bold text-slate-900 mt-1">{formatEgp(costingData.financialSummary.revenueEgp, language)}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-slate-500 font-semibold">{language === 'en' ? 'Actual COGS' : 'إجمالي التكلفة الفعلية'}</span>
                <p className="text-base font-bold text-slate-900 mt-1">{formatEgp(costingData.financialSummary.totalActualCOGS, language)}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <span className="text-emerald-700 font-semibold">{language === 'en' ? 'Gross Margin' : 'هامش الربح المحقق'}</span>
                <p className="text-base font-bold text-emerald-800 mt-1">
                  {formatEgp(costingData.financialSummary.grossMarginEgp, language)} ({costingData.financialSummary.grossMarginPercent}%)
                </p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-2">
              <h5 className="font-bold text-slate-900 text-xs">
                {language === 'en' ? 'Planned vs Actual Cost Comparison:' : 'المقارنة بين التكلفة التقديرية والتكلفة الفعلية:'}
              </h5>
              <div className="grid grid-cols-3 gap-3 text-[11px] bg-white p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500 block">{language === 'en' ? 'Direct Materials:' : 'تكلفة الخامات:'}</span>
                  {language === 'en' ? 'Planned:' : 'مخطط:'} <span className="font-mono">{costingData.financialSummary.plannedVersusActual.plannedMaterial}</span>
                  <br />
                  {language === 'en' ? 'Actual:' : 'فعلي:'} <span className="font-mono font-bold text-emerald-700">{costingData.financialSummary.plannedVersusActual.actualMaterial} EGP</span>
                </div>
                <div>
                  <span className="text-slate-500 block">{language === 'en' ? 'Direct Labor:' : 'تكلفة أجور العمالة:'}</span>
                  {language === 'en' ? 'Planned:' : 'مخطط:'} <span className="font-mono">{costingData.financialSummary.plannedVersusActual.plannedLabor}</span>
                  <br />
                  {language === 'en' ? 'Actual:' : 'فعلي:'} <span className="font-mono font-bold text-emerald-700">{costingData.financialSummary.plannedVersusActual.actualLabor} EGP</span>
                </div>
                <div>
                  <span className="text-slate-500 block">{language === 'en' ? 'Machine Overhead:' : 'استهلاك الماكينات:'}</span>
                  {language === 'en' ? 'Planned:' : 'مخطط:'} <span className="font-mono">{costingData.financialSummary.plannedVersusActual.plannedOverhead}</span>
                  <br />
                  {language === 'en' ? 'Actual:' : 'فعلي:'} <span className="font-mono font-bold text-emerald-700">{costingData.financialSummary.plannedVersusActual.actualOverhead} EGP</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setCostingData(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
              >
                {language === 'en' ? 'Close' : 'إغلاق'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL: RECORD PAYMENT */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title={language === 'en' ? 'Record Customer Payment' : 'تسجيل سند قبض وتحصيل دفعة'}
        subtitle={language === 'en' ? 'Bank transfer or commercial cheque' : 'إثبات تحويل بنكي أو شيك بالبنك الأهلي المصري'}
      >
        <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {language === 'en' ? 'Payment Amount (EGP) *' : 'قيمة الدفعة المحصلة (ج.م) *'}
            </label>
            <input
              type="number"
              required
              value={payAmount}
              onChange={(e) => setPayAmount(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-base focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'en' ? 'Payment Method' : 'طريقة السداد'}
              </label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
              >
                <option value="BANK_TRANSFER">Bank Transfer (سويفت بنكي)</option>
                <option value="CHEQUE">Commercial Cheque (شيك بنكي)</option>
                <option value="CASH">Cash Treasury (خزينة نقدية)</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'en' ? 'Bank Name' : 'اسم البنك المودع به'}
              </label>
              <input
                type="text"
                value={payBank}
                onChange={(e) => setPayBank(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {language === 'en' ? 'Transfer Reference / Cheque #' : 'رقم مرجع التحويل أو الشيك'}
            </label>
            <input
              type="text"
              value={payRef}
              onChange={(e) => setPayRef(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
              placeholder="TRF-NBE-991204"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsPayModalOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm"
            >
              {language === 'en' ? 'Post Payment Receipt' : 'تسجيل سند القبض'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
