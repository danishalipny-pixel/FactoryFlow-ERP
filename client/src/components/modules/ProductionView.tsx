import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { ProductionOrder, ProductionOperation, MaterialRequirement, Employee } from '../../types/erp';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { formatEgp, formatDate } from '../../utils/formatters';
import { useLanguage } from '../../context/LanguageContext';
import {
  Factory,
  CheckCircle,
  Play,
  Boxes,
  ShieldCheck,
} from 'lucide-react';

export const ProductionView: React.FC = () => {
  const { language, isRtl, t } = useLanguage();
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected order for detailed Job Cards
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);

  // Operation action modal
  const [activeOp, setActiveOp] = useState<ProductionOperation | null>(null);
  const [opActualHours, setOpActualHours] = useState(0);
  const [opGoodQty, setOpGoodQty] = useState(0);
  const [opScrapQty, setOpScrapQty] = useState(0);
  const [opNotes, setOpNotes] = useState('');
  const [opEmployeeId, setOpEmployeeId] = useState('');

  // Issue Material Modal
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState<MaterialRequirement | null>(null);
  const [issueQty, setIssueQty] = useState(0);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const [ordRes, empRes] = await Promise.all([
        apiRequest<{ orders: ProductionOrder[] }>('/production/orders'),
        apiRequest<{ employees: Employee[] }>('/hr/employees'),
      ]);
      setOrders(ordRes.orders);
      setEmployees(empRes.employees);
      if (selectedOrder) {
        const refreshed = ordRes.orders.find((o) => o.id === selectedOrder.id);
        if (refreshed) setSelectedOrder(refreshed);
      }
    } catch (e) {
      console.error('Failed to load production orders:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOperationStatus = async (status: string) => {
    if (!activeOp) return;
    try {
      await apiRequest(`/production/operations/${activeOp.id}/update-status`, {
        method: 'POST',
        body: JSON.stringify({
          status,
          actualHours: opActualHours,
          goodQuantity: opGoodQty,
          scrapQuantity: opScrapQty,
          notes: opNotes,
          assignedEmployeeId: opEmployeeId || undefined,
        }),
      });
      setActiveOp(null);
      fetchOrders();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleIssueMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq || !selectedOrder) return;
    try {
      await apiRequest(`/production/orders/${selectedOrder.id}/issue-material`, {
        method: 'POST',
        body: JSON.stringify({
          materialRequirementId: selectedReq.id,
          quantityToIssue: issueQty,
        }),
      });
      setIsIssueModalOpen(false);
      alert(language === 'en'
        ? 'Materials successfully issued from warehouse! Job costing updated.'
        : 'تم صرف الخامات من المستودع بنجاح وتحديث تكلفة الأمر الفعلية!');
      fetchOrders();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCompleteOrder = async (orderId: string, plannedQty: number) => {
    const confirmPrompt = language === 'en'
      ? 'Are you sure all manufacturing operations are finished and ready for final QC inspection?'
      : 'هل أنت متأكد من اكتمال كافة عمليات التشغيل وتحويل الأمر للفحص النهائي؟';
    if (!window.confirm(confirmPrompt)) return;
    try {
      await apiRequest(`/production/orders/${orderId}/complete`, {
        method: 'POST',
        body: JSON.stringify({
          completedQuantity: plannedQty,
          scrappedQuantity: 0,
          notes: language === 'en' ? 'Completed manufacturing job. Transferred to final QC.' : 'اكتمال تصنيع الأمر وتحويله للتفتيش النهائي',
        }),
      });
      alert(language === 'en' ? 'Job completed and sent to QC!' : 'تم اكتمال أمر الإنتاج وتحويله لقسم توكيد الجودة!');
      fetchOrders();
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
              {language === 'en' ? 'MTO Production Management & Job Cards' : 'إدارة الإنتاج وبطاقات التشغيل MTO'}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              Shop Floor Control
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'en'
              ? 'Real-time work center tracking, job card progression, material consumption, and actual labor & machine costing.'
              : 'متابعة مراحل التشغيل بالورش، صرف المواد، تسجيل الهالك، واحتساب تكاليف التصنيع الفعلية'}
          </p>
        </div>
      </div>

      {/* Production Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-xs">
            {language === 'en' ? 'Active Production Orders (MTO)' : 'أوامر التصنيع النشطة المرتبطة بأوامر العملاء'}
          </h3>
          <span className="text-xs font-bold text-slate-500">{orders.length} {language === 'en' ? 'Orders' : 'أوامر'}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-white">
                <th className="py-3 px-4 text-start">{language === 'en' ? 'Job #' : 'أمر الإنتاج'}</th>
                <th className="py-3 px-4 text-start">{language === 'en' ? 'Customer & Sales Order' : 'أمر المبيعات والعميل'}</th>
                <th className="py-3 px-4 text-start">{t.product}</th>
                <th className="py-3 px-4 text-center">{language === 'en' ? 'Planned Qty' : 'الكمية المطلوبة'}</th>
                <th className="py-3 px-4 text-center">{language === 'en' ? 'Completed' : 'المكتمل'}</th>
                <th className="py-3 px-4 text-start">{language === 'en' ? 'Due Date' : 'تاريخ الاستحقاق'}</th>
                <th className="py-3 px-4 text-end">{language === 'en' ? 'Actual Cost To Date' : 'التكلفة الفعلية حتى الآن'}</th>
                <th className="py-3 px-4 text-center">{t.status}</th>
                <th className="py-3 px-4 text-center">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((po) => {
                const progress = po.plannedQuantity > 0 ? Math.round((po.completedQuantity / po.plannedQuantity) * 100) : 0;
                const custName = language === 'en' ? (po.salesOrder?.customer.nameEn || po.salesOrder?.customer.nameAr) : po.salesOrder?.customer.nameAr;
                const prdName = language === 'en' ? (po.product.nameEn || po.product.nameAr) : po.product.nameAr;
                return (
                  <tr key={po.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{po.orderNumber}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{custName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {language === 'en' ? 'SO:' : 'أمر مبيعات:'} {po.salesOrder?.orderNumber}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">{prdName}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-800">{po.plannedQuantity} {po.product.unit}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-bold text-emerald-700">{po.completedQuantity}</span>
                      <span className="text-slate-400 ms-1">({progress}%)</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{formatDate(po.plannedDueDate, language)}</td>
                    <td className="py-3.5 px-4 text-end font-mono font-bold text-slate-900">{formatEgp(po.totalActualCostEgp, language)}</td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge status={po.status} />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setSelectedOrder(po)}
                        className="px-3 py-1.5 bg-industrial-900 hover:bg-industrial-800 text-white rounded-lg text-xs font-semibold transition-colors"
                      >
                        {language === 'en' ? 'Job Card & Materials' : 'بطاقة التشغيل والمواد'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SELECTED ORDER DETAIL: JOB CARDS & MATERIAL ALLOCATION */}
      {selectedOrder && (
        <div className="bg-white rounded-2xl border-2 border-industrial-900/40 p-6 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-industrial-900 text-white font-mono font-bold text-xs">
                  {selectedOrder.orderNumber}
                </span>
                <h3 className="font-bold text-slate-900 text-base">
                  {language === 'en' ? (selectedOrder.product.nameEn || selectedOrder.product.nameAr) : selectedOrder.product.nameAr} - {language === 'en' ? 'Customer:' : 'للعميل:'} {language === 'en' ? (selectedOrder.salesOrder?.customer.nameEn || selectedOrder.salesOrder?.customer.nameAr) : selectedOrder.salesOrder?.customer.nameAr}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {language === 'en' ? 'Delivery Deadline:' : 'تاريخ التسليم المستهدف:'} <span className="font-bold text-slate-800">{formatDate(selectedOrder.plannedDueDate, language)}</span> | {language === 'en' ? 'Sales Order:' : 'أمر البيع التعاقدي:'} <span className="font-mono font-semibold">{selectedOrder.salesOrder?.orderNumber}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              {selectedOrder.status !== 'COMPLETED' && selectedOrder.status !== 'QC_INSPECTION' && (
                <button
                  onClick={() => handleCompleteOrder(selectedOrder.id, selectedOrder.plannedQuantity)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{language === 'en' ? 'Complete & Transfer to QC' : 'اعتماد إتمام التصنيع وتحويل للجودة'}</span>
                </button>
              )}
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-3 py-2 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                ✕
              </button>
            </div>
          </div>

          {/* TWO COLUMNS: OPERATIONS ROUTING & MATERIAL REQUIREMENTS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* COLUMN 1: OPERATIONS / JOB CARDS */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Factory className="w-4 h-4 text-emerald-600" />
                  <h4 className="font-bold text-slate-900 text-xs">
                    {language === 'en' ? 'Production Routing & Work Operations' : 'مراحل وبطاقات التشغيل بمراكز العمل (Routings)'}
                  </h4>
                </div>
                <span className="text-[11px] text-slate-500">
                  {selectedOrder.operations?.length || 0} {language === 'en' ? 'Steps' : 'مراحل'}
                </span>
              </div>

              <div className="space-y-3">
                {selectedOrder.operations?.map((op) => {
                  const opName = language === 'en' ? (op.operationNameEn || op.operationNameAr) : op.operationNameAr;
                  const wcName = language === 'en' ? (op.workCenter?.nameEn || op.workCenter?.nameAr) : op.workCenter?.nameAr;
                  const empName = op.assignedEmployee ? (language === 'en' ? (op.assignedEmployee.firstNameEn ? `${op.assignedEmployee.firstNameEn} ${op.assignedEmployee.lastNameEn}` : op.assignedEmployee.firstNameAr) : op.assignedEmployee.firstNameAr) : (language === 'en' ? 'Unassigned' : 'لم يعين');

                  return (
                    <div
                      key={op.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-industrial-900 text-white text-xs font-bold flex items-center justify-center">
                            {op.sequenceOrder}
                          </span>
                          <div>
                            <h5 className="font-bold text-slate-900 text-xs">{opName}</h5>
                            <span className="text-[11px] text-slate-500 font-mono">
                              {language === 'en' ? 'Work Center:' : 'مركز العمل:'} {wcName}
                            </span>
                          </div>
                        </div>
                        <Badge status={op.status} />
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600 pt-2 border-t border-slate-200">
                        <div>
                          <span>{language === 'en' ? 'Planned:' : 'الساعات المخططة:'}</span> <span className="font-bold text-slate-900">{op.plannedHours} h</span>
                        </div>
                        <div>
                          <span>{language === 'en' ? 'Actual:' : 'الساعات الفعلية:'}</span> <span className="font-bold text-emerald-700">{op.actualHours} h</span>
                        </div>
                        <div>
                          <span>{language === 'en' ? 'Operator:' : 'فني التشغيل:'}</span> <span className="font-semibold text-slate-900">{empName}</span>
                        </div>
                      </div>

                      {/* Operational Action Buttons */}
                      <div className="flex items-center justify-end gap-2 pt-1">
                        {op.status === 'PENDING' && (
                          <button
                            onClick={() => {
                              setActiveOp(op);
                              setOpActualHours(op.plannedHours);
                              setOpGoodQty(selectedOrder.plannedQuantity);
                              setOpScrapQty(0);
                              handleUpdateOperationStatus('IN_PROGRESS');
                            }}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>{language === 'en' ? 'Start Operation' : 'بدء التشغيل'}</span>
                          </button>
                        )}

                        {op.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => {
                              setActiveOp(op);
                              setOpActualHours(op.plannedHours);
                              setOpGoodQty(selectedOrder.plannedQuantity);
                              setOpScrapQty(0);
                            }}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>{language === 'en' ? 'Record Output & Scrap' : 'تسجيل الإنجاز والهالك'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* COLUMN 2: MATERIAL REQUIREMENTS & CONSUMPTION */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-emerald-600" />
                  <h4 className="font-bold text-slate-900 text-xs">
                    {language === 'en' ? 'Order-Dedicated Materials & Consumption' : 'الخامات المحجوزة والمصروفة للأمر (MTO Allocation)'}
                  </h4>
                </div>
                <span className="text-[11px] text-slate-500">
                  {selectedOrder.materialRequirements?.length || 0} {language === 'en' ? 'Materials' : 'خامات'}
                </span>
              </div>

              <div className="space-y-3">
                {selectedOrder.materialRequirements?.map((mr) => {
                  const matName = language === 'en' ? (mr.materialProduct?.nameEn || mr.materialProduct?.nameAr) : mr.materialProduct?.nameAr;
                  return (
                    <div
                      key={mr.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900 text-xs">{matName}</span>
                          <div className="text-[11px] text-slate-500 font-mono">{mr.materialProduct?.itemCode}</div>
                        </div>
                        <Badge status={mr.status} />
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg font-mono">
                        <div>
                          {language === 'en' ? 'Required:' : 'المطلوب:'} <span className="font-bold text-slate-900">{mr.requiredQuantity}</span>
                        </div>
                        <div>
                          {language === 'en' ? 'Reserved:' : 'المحجوز:'} <span className="font-bold text-indigo-700">{mr.reservedQuantity}</span>
                        </div>
                        <div>
                          {language === 'en' ? 'Issued:' : 'المصروف:'} <span className="font-bold text-emerald-700">{mr.issuedQuantity}</span>
                        </div>
                      </div>

                      {mr.shortageQuantity > 0 && (
                        <div className="text-[11px] text-rose-700 font-bold bg-rose-50 px-2.5 py-1 rounded-lg">
                          {language === 'en'
                            ? `Shortage of ${mr.shortageQuantity} ${mr.materialProduct?.unit}. Purchase requisition issued.`
                            : `⚠️ يوجد عجز ${mr.shortageQuantity} ${mr.materialProduct?.unit} تم إصدار طلب شراء عاجل له.`}
                        </div>
                      )}

                      {mr.issuedQuantity < mr.requiredQuantity && mr.reservedQuantity > 0 && (
                        <div className="flex justify-end pt-1">
                          <button
                            onClick={() => {
                              setSelectedReq(mr);
                              setIssueQty(mr.reservedQuantity - mr.issuedQuantity);
                              setIsIssueModalOpen(true);
                            }}
                            className="px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold"
                          >
                            {language === 'en' ? 'Issue Reserved Material' : 'صرف الخامات المحجوزة'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RECORD OPERATION OUTPUT & SCRAP */}
      <Modal
        isOpen={Boolean(activeOp)}
        onClose={() => setActiveOp(null)}
        title={language === 'en' ? 'Record Operation Output & Machine Hours' : 'تسجيل إنجاز مرحلة التشغيل واحتساب التكلفة'}
        subtitle={activeOp ? (language === 'en' ? (activeOp.operationNameEn || activeOp.operationNameAr) : activeOp.operationNameAr) : ''}
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'en' ? 'Actual Hours *' : 'الساعات الفعلية المستغرقة *'}
              </label>
              <input
                type="number"
                step="0.5"
                value={opActualHours}
                onChange={(e) => setOpActualHours(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'en' ? 'Assigned Operator' : 'فني التشغيل المسؤول'}
              </label>
              <select
                value={opEmployeeId}
                onChange={(e) => setOpEmployeeId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
              >
                <option value="">{language === 'en' ? 'Select Operator...' : 'اختر الفني المسند إليه العمل...'}</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {language === 'en' ? (emp.firstNameEn ? `${emp.firstNameEn} ${emp.lastNameEn}` : emp.firstNameAr) : `${emp.firstNameAr} ${emp.lastNameAr}`} ({emp.jobTitleAr})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'en' ? 'Good Quantity Completed' : 'الكمية السليمة المنجزة'}
              </label>
              <input
                type="number"
                value={opGoodQty}
                onChange={(e) => setOpGoodQty(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-rose-700 mb-1">
                {language === 'en' ? 'Scrap / Wastage Qty' : 'كمية الهالك أو الخردة (إن وجد)'}
              </label>
              <input
                type="number"
                value={opScrapQty}
                onChange={(e) => setOpScrapQty(Number(e.target.value))}
                className="w-full px-3 py-2 border border-rose-300 rounded-xl font-mono text-rose-800"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {language === 'en' ? 'Operation & Machine Notes' : 'ملاحظات التشغيل وجودة التشطيب'}
            </label>
            <textarea
              rows={2}
              value={opNotes}
              onChange={(e) => setOpNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              placeholder={language === 'en' ? 'Tolerance checks, tool wear notes...' : 'أي ملاحظات حول دقة المقاسات أو حالة الماكينة...'}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              onClick={() => setActiveOp(null)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50"
            >
              {t.cancel}
            </button>
            <button
              onClick={() => handleUpdateOperationStatus('COMPLETED')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm"
            >
              {language === 'en' ? 'Save & Complete Step' : 'حفظ واكتمال المرحلة'}
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: ISSUE MATERIAL TO PRODUCTION */}
      <Modal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        title={language === 'en' ? 'Issue Reserved Material to Production' : 'إذن صرف خامات محجوزة لأمر التشغيل'}
        subtitle={selectedReq ? (language === 'en' ? (selectedReq.materialProduct?.nameEn || selectedReq.materialProduct?.nameAr) : selectedReq.materialProduct?.nameAr) : ''}
      >
        <form onSubmit={handleIssueMaterial} className="space-y-4 text-xs">
          <div>
            <p className="text-slate-600 mb-1">
              {language === 'en' ? 'Material:' : 'الخامة:'} <span className="font-bold text-slate-900">{language === 'en' ? (selectedReq?.materialProduct?.nameEn || selectedReq?.materialProduct?.nameAr) : selectedReq?.materialProduct?.nameAr}</span> ({selectedReq?.materialProduct?.itemCode})
            </p>
            <p className="text-slate-600 mb-4">
              {language === 'en' ? 'Unit:' : 'الوحدة:'} <span className="font-bold text-slate-900">{selectedReq?.materialProduct?.unit}</span> | {language === 'en' ? 'Unit Cost:' : 'التكلفة للوحدة:'} <span className="font-bold text-slate-900 font-mono">{formatEgp(selectedReq?.unitCostEgp, language)}</span>
            </p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {language === 'en' ? 'Quantity to Issue *' : 'الكمية المراد صرفها من المحجوز *'}
            </label>
            <input
              type="number"
              min="0.1"
              step="any"
              value={issueQty}
              onChange={(e) => setIssueQty(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-base focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
            {language === 'en'
              ? 'Issuing material strictly deducts from physical inventory, prevents unauthorized negative stock, and posts the actual material cost directly to the customer job.'
              : '⚠️ الصرف يخصم مباشرة من رصيد المخزن الفعلي ويمنع أي رصيد سالب، ويقوم بتحميل تكلفة الخامة الفعلية على أمر العميل.'}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsIssueModalOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm"
            >
              {language === 'en' ? 'Confirm Issue to Job' : 'تأكيد الصرف للتشغيل'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
