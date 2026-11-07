import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { InventoryItem, MaterialReservation, StockMovement, Warehouse } from '../../types/erp';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { formatEgp, formatDate, formatDateTime } from '../../utils/formatters';
import { useLanguage } from '../../context/LanguageContext';
import {
  Boxes,
  Warehouse as WhIcon,
  ShieldAlert,
} from 'lucide-react';

export const InventoryView: React.FC = () => {
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'stock' | 'reservations' | 'movements' | 'warehouses'>('stock');

  const [stock, setStock] = useState<InventoryItem[]>([]);
  const [reservations, setReservations] = useState<MaterialReservation[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);

  // Adjustment Modal
  const [isAdjModalOpen, setIsAdjModalOpen] = useState(false);
  const [adjWarehouseId, setAdjWarehouseId] = useState('');
  const [adjProductId, setAdjProductId] = useState('');
  const [adjQuantity, setAdjQuantity] = useState(0);
  const [adjReason, setAdjReason] = useState('');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const [stkRes, resRes, movRes, whRes] = await Promise.all([
        apiRequest<{ stock: InventoryItem[] }>('/inventory/stock'),
        apiRequest<{ reservations: MaterialReservation[] }>('/inventory/reservations'),
        apiRequest<{ movements: StockMovement[] }>('/inventory/movements'),
        apiRequest<{ warehouses: Warehouse[] }>('/inventory/warehouses'),
      ]);
      setStock(stkRes.stock);
      setReservations(resRes.reservations);
      setMovements(movRes.movements);
      setWarehouses(whRes.warehouses);
      if (whRes.warehouses.length > 0) setAdjWarehouseId(whRes.warehouses[0].id);
      if (stkRes.stock.length > 0) setAdjProductId(stkRes.stock[0].productId);
    } catch (e) {
      console.error('Failed to load inventory data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/inventory/adjustments', {
        method: 'POST',
        body: JSON.stringify({
          warehouseId: adjWarehouseId,
          productId: adjProductId,
          adjustmentQuantity: adjQuantity,
          reason: adjReason,
        }),
      });
      setIsAdjModalOpen(false);
      alert(language === 'en'
        ? 'Inventory adjustment executed successfully with full audit trail!'
        : 'تم تنفيذ التسوية المخزنية وتحديث الحركة الرقابية بنجاح!');
      fetchInventory();
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
              {language === 'en' ? 'Inventory & Order Allocations' : 'المخازن وحجوزات الخامات لأوامر MTO'}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              Reserved Stock Shield
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'en'
              ? 'Raw materials are dedicated exclusively to customer orders to prevent unauthorized stock poaching.'
              : 'تخصيص الخامات حصرياً لأوامر تصنيع العملاء ومنع استهلاكها في أوامر أخرى دون إذن'}
          </p>
        </div>

        <button
          onClick={() => setIsAdjModalOpen(true)}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2 shadow-sm"
        >
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span>{language === 'en' ? 'Stock Adjustment' : 'تسوية جردية رقابية'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('stock')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'stock' ? 'bg-industrial-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {language === 'en' ? 'Live Warehouse Stock' : 'أرصدة الخامات والمستودعات'} ({stock.length})
        </button>
        <button
          onClick={() => setActiveTab('reservations')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'reservations' ? 'bg-industrial-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {language === 'en' ? 'MTO Order Reservations' : 'حجوزات الخامات لأوامر العملاء'} ({reservations.length})
        </button>
        <button
          onClick={() => setActiveTab('movements')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'movements' ? 'bg-industrial-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {language === 'en' ? 'Stock Movements' : 'سجل حركة المخازن (Audit)'} ({movements.length})
        </button>
        <button
          onClick={() => setActiveTab('warehouses')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'warehouses' ? 'bg-industrial-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {language === 'en' ? 'Warehouses' : 'المستودعات والعنابر'} ({warehouses.length})
        </button>
      </div>

      {/* TAB 1: LIVE STOCK WITH MTO RESERVATIONS BREAKDOWN */}
      {activeTab === 'stock' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold">
                  <th className="py-3 px-4 text-start">{language === 'en' ? 'Item Code' : 'كود الخامة'}</th>
                  <th className="py-3 px-4 text-start">{language === 'en' ? 'Description' : 'اسم الخامة'}</th>
                  <th className="py-3 px-4 text-start">{language === 'en' ? 'Warehouse' : 'المستودع'}</th>
                  <th className="py-3 px-4 text-center">{language === 'en' ? 'Bin' : 'الموقع'}</th>
                  <th className="py-3 px-4 text-end">{language === 'en' ? 'On Hand' : 'الرصيد الفعلي (On Hand)'}</th>
                  <th className="py-3 px-4 text-end text-indigo-700">{language === 'en' ? 'Reserved (MTO)' : 'المحجوز للأوامر (Reserved)'}</th>
                  <th className="py-3 px-4 text-end text-emerald-700">{language === 'en' ? 'Free Available' : 'المتاح الحر (Available)'}</th>
                  <th className="py-3 px-4 text-end">{language === 'en' ? 'Avg Cost' : 'متوسط التكلفة'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stock.map((item) => {
                  const prdName = language === 'en' ? (item.product.nameEn || item.product.nameAr) : item.product.nameAr;
                  const whName = language === 'en' ? (item.warehouse.nameEn || item.warehouse.nameAr) : item.warehouse.nameAr;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{item.product.itemCode}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{prdName}</td>
                      <td className="py-3.5 px-4 text-slate-600">{whName}</td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-500">{item.locationBin || '-'}</td>
                      <td className="py-3.5 px-4 text-end font-mono font-bold text-slate-900">
                        {item.quantityOnHand} {item.product.unit}
                      </td>
                      <td className="py-3.5 px-4 text-end font-mono font-bold text-indigo-700 bg-indigo-50/40">
                        {item.quantityReserved} {item.product.unit}
                      </td>
                      <td className="py-3.5 px-4 text-end font-mono font-bold text-emerald-800 bg-emerald-50/40">
                        {item.quantityAvailable} {item.product.unit}
                      </td>
                      <td className="py-3.5 px-4 text-end font-mono text-slate-700">{formatEgp(item.averageUnitCostEgp, language)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: MTO RESERVATIONS */}
      {activeTab === 'reservations' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold">
                  <th className="py-3 px-4 text-start">{language === 'en' ? 'Sales Order #' : 'أمر المبيعات'}</th>
                  <th className="py-3 px-4 text-start">{t.customer}</th>
                  <th className="py-3 px-4 text-start">{language === 'en' ? 'Reserved Material' : 'الخامة المحجوزة'}</th>
                  <th className="py-3 px-4 text-end">{language === 'en' ? 'Reserved Qty' : 'الكمية المحجوزة حصرياً'}</th>
                  <th className="py-3 px-4 text-start">{language === 'en' ? 'Reserved At' : 'تاريخ الحجز'}</th>
                  <th className="py-3 px-4 text-center">{t.status}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reservations.map((res) => {
                  const custName = language === 'en' ? (res.salesOrder.customer.nameEn || res.salesOrder.customer.nameAr) : res.salesOrder.customer.nameAr;
                  const matName = language === 'en' ? (res.materialProduct.nameEn || res.materialProduct.nameAr) : res.materialProduct.nameAr;
                  return (
                    <tr key={res.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{res.salesOrder.orderNumber}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{custName}</td>
                      <td className="py-3.5 px-4 text-slate-800">
                        <span className="font-semibold">{matName}</span>
                        <span className="text-slate-500 font-mono ms-2">({res.materialProduct.itemCode})</span>
                      </td>
                      <td className="py-3.5 px-4 text-end font-mono font-bold text-indigo-700">
                        {res.quantityReserved} {res.materialProduct.unit}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{formatDate(res.reservedAt, language)}</td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge status={res.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MOVEMENTS */}
      {activeTab === 'movements' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold">
                  <th className="py-3 px-4 text-start">{language === 'en' ? 'Movement #' : 'رقم الإذن'}</th>
                  <th className="py-3 px-4 text-start">{language === 'en' ? 'Type' : 'نوع الحركة'}</th>
                  <th className="py-3 px-4 text-start">{language === 'en' ? 'Item' : 'الصنف / الخامة'}</th>
                  <th className="py-3 px-4 text-start">{language === 'en' ? 'Warehouse' : 'المستودع'}</th>
                  <th className="py-3 px-4 text-end">{language === 'en' ? 'Quantity' : 'الكمية'}</th>
                  <th className="py-3 px-4 text-start">{language === 'en' ? 'User' : 'القائم بالحركة'}</th>
                  <th className="py-3 px-4 text-start">{language === 'en' ? 'Timestamp' : 'الوقت والتاريخ'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.map((mov) => {
                  const isPositive = mov.quantity > 0;
                  const prdName = language === 'en' ? (mov.product.nameEn || mov.product.nameAr) : mov.product.nameAr;
                  const whName = language === 'en' ? (mov.warehouse.nameEn || mov.warehouse.nameAr) : mov.warehouse.nameAr;
                  const typeLabel = mov.movementType === 'PO_RECEIPT'
                    ? (language === 'en' ? 'PO Receipt' : 'استلام توريد')
                    : mov.movementType === 'PROD_ISSUE'
                    ? (language === 'en' ? 'Production Issue' : 'صرف للإنتاج')
                    : (language === 'en' ? 'Adjustment' : 'تسوية مخزنية');

                  return (
                    <tr key={mov.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{mov.movementNumber}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          isPositive ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {typeLabel}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-900">{prdName}</td>
                      <td className="py-3.5 px-4 text-slate-600">{whName}</td>
                      <td className="py-3.5 px-4 text-end font-mono font-bold">
                        <span className={isPositive ? 'text-emerald-700' : 'text-rose-700'}>
                          {isPositive ? `+${mov.quantity}` : mov.quantity} {mov.product.unit}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">{mov.performedBy || (language === 'en' ? 'Storekeeper' : 'أمين المخزن')}</td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono">{formatDateTime(mov.createdAt, language)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: WAREHOUSES */}
      {activeTab === 'warehouses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {warehouses.map((wh) => {
            const whName = language === 'en' ? (wh.nameEn || wh.nameAr) : wh.nameAr;
            const whSubtitle = language === 'en' ? wh.nameAr : wh.nameEn;
            return (
              <div key={wh.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-industrial-800">
                  <WhIcon className="w-5 h-5 text-emerald-600" />
                  <span className="font-mono font-bold text-xs">{wh.code}</span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm">{whName}</h4>
                <p className="text-xs text-slate-500">{whSubtitle}</p>
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                  {language === 'en' ? 'Location:' : 'الموقع:'} {wh.location || (language === 'en' ? '10th of Ramadan Plant Complex' : 'مجمع مصانع العاشر من رمضان')}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: STOCK ADJUSTMENT */}
      <Modal
        isOpen={isAdjModalOpen}
        onClose={() => setIsAdjModalOpen(false)}
        title={language === 'en' ? 'Stock Inventory Adjustment' : 'إجراء تسوية مخزنية جردية'}
        subtitle={language === 'en' ? 'Regulated adjustment with reservation protection' : 'تسوية خاضعة للرقابة والتدقيق وحماية الخامات المحجوزة'}
      >
        <form onSubmit={handleCreateAdjustment} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {language === 'en' ? 'Warehouse *' : 'المستودع *'}
            </label>
            <select
              value={adjWarehouseId}
              onChange={(e) => setAdjWarehouseId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
            >
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {language === 'en' ? (wh.nameEn || wh.nameAr) : wh.nameAr} ({wh.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {language === 'en' ? 'Item / Material *' : 'الخامة أو الصنف *'}
            </label>
            <select
              value={adjProductId}
              onChange={(e) => setAdjProductId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
            >
              {stock.map((item) => (
                <option key={item.productId} value={item.productId}>
                  {language === 'en' ? (item.product.nameEn || item.product.nameAr) : item.product.nameAr} ({item.product.itemCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {language === 'en' ? 'Adjustment Quantity (+ for surplus, - for loss) *' : 'كمية التسوية (موجبة للزيادة، سالبة للعجز) *'}
            </label>
            <input
              type="number"
              step="any"
              required
              value={adjQuantity}
              onChange={(e) => setAdjQuantity(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
              placeholder="+50 / -20"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {language === 'en' ? 'Adjustment Reason & Audit Reference *' : 'سبب التسوية ورقم محضر الجرد *'}
            </label>
            <textarea
              required
              rows={2}
              value={adjReason}
              onChange={(e) => setAdjReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              placeholder={language === 'en' ? 'Physical count audit reference #44...' : 'محضر جرد دوري رقم 44 لسنة 2026...'}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsAdjModalOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow-sm"
            >
              {language === 'en' ? 'Post Adjustment' : 'اعتماد التسوية'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
