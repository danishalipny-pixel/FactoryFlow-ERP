import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { authenticateToken, requireRoles } from '../middleware/auth';
import { logAudit } from '../middleware/audit';

const router = Router();

// ----------------------------------------------------
// SUPPLIERS
// ----------------------------------------------------
router.get('/suppliers', authenticateToken, async (req: Request, res: Response) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: {
        _count: {
          select: { purchaseOrders: true, goodsReceipts: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ suppliers });
  } catch (error) {
    return res.status(500).json({ error: 'فشل استرجاع قائمة الموردين' });
  }
});

router.post('/suppliers', authenticateToken, requireRoles(['SUPER_ADMIN', 'PROCUREMENT_MANAGER', 'FACTORY_OWNER']), async (req: Request, res: Response) => {
  try {
    const { nameAr, nameEn, taxRegistrationNo, commercialRegNo, contactPerson, email, phone, address, category, paymentTermsDays, rating } = req.body;

    if (!nameAr) {
      return res.status(400).json({ error: 'اسم المورد باللغة العربية مطلوب' });
    }

    const count = await prisma.supplier.count();
    const code = `SUP-EGY-${String(count + 1).padStart(3, '0')}`;

    const supplier = await prisma.supplier.create({
      data: {
        code,
        nameAr,
        nameEn: nameEn || nameAr,
        taxRegistrationNo,
        commercialRegNo,
        contactPerson,
        email,
        phone,
        address,
        category: category || 'METALS',
        paymentTermsDays: Number(paymentTermsDays) || 30,
        rating: Number(rating) || 4.5,
      },
    });

    await logAudit(req, 'CREATE', 'Supplier', supplier.id, `إضافة مورد جديد: ${nameAr}`);
    return res.status(201).json({ supplier });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'فشل حفظ المورد' });
  }
});

// ----------------------------------------------------
// PURCHASE REQUESTS (MTO Shortages)
// ----------------------------------------------------
router.get('/requests', authenticateToken, async (req: Request, res: Response) => {
  try {
    const requests = await prisma.purchaseRequest.findMany({
      include: {
        salesOrder: {
          include: { customer: true },
        },
        items: {
          include: { product: true },
        },
      },
      orderBy: { requestDate: 'desc' },
    });
    return res.json({ requests });
  } catch (error) {
    return res.status(500).json({ error: 'فشل استرجاع طلبات الشراء' });
  }
});

// ----------------------------------------------------
// PURCHASE ORDERS
// ----------------------------------------------------
router.get('/orders', authenticateToken, async (req: Request, res: Response) => {
  try {
    const orders = await prisma.purchaseOrder.findMany({
      include: {
        supplier: true,
        items: {
          include: { product: true },
        },
        goodsReceipts: true,
      },
      orderBy: { orderDate: 'desc' },
    });
    return res.json({ orders });
  } catch (error) {
    return res.status(500).json({ error: 'فشل استرجاع أوامر الشراء' });
  }
});

router.post('/orders', authenticateToken, requireRoles(['SUPER_ADMIN', 'PROCUREMENT_MANAGER', 'FACTORY_OWNER']), async (req: Request, res: Response) => {
  try {
    const { supplierId, expectedDeliveryDays, paymentTerms, notes, items } = req.body;

    if (!supplierId || !items || !items.length) {
      return res.status(400).json({ error: 'المورد وبنود أمر الشراء مطلوبة' });
    }

    const count = await prisma.purchaseOrder.count();
    const poNumber = `PO-2026-${String(count + 1).padStart(4, '0')}`;

    const expectedDeliveryDate = new Date();
    expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + (Number(expectedDeliveryDays) || 14));

    let subtotal = 0;
    const itemsData = [];

    for (const item of items) {
      const lineTotal = Number(item.quantity) * Number(item.unitPriceEgp);
      subtotal += lineTotal;
      itemsData.push({
        productId: item.productId,
        quantity: Number(item.quantity),
        unitPriceEgp: Number(item.unitPriceEgp),
        totalPriceEgp: lineTotal,
      });
    }

    const vatRatePercent = 14.0;
    const vatAmountEgp = (subtotal * vatRatePercent) / 100;
    const whtRatePercent = 1.0;
    const whtAmountEgp = (subtotal * whtRatePercent) / 100;
    const totalAmountEgp = subtotal + vatAmountEgp - whtAmountEgp;

    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplierId,
        expectedDeliveryDate,
        status: 'CONFIRMED',
        subtotalEgp: subtotal,
        vatRatePercent,
        vatAmountEgp,
        whtRatePercent,
        whtAmountEgp,
        totalAmountEgp,
        paymentTerms: paymentTerms || 'سداد خلال 30 يوم من الفاتورة',
        notes,
        items: {
          create: itemsData,
        },
      },
      include: { supplier: true, items: { include: { product: true } } },
    });

    await logAudit(req, 'CREATE', 'PurchaseOrder', po.id, `إصدار أمر شراء رقم ${poNumber} للمورد`);
    return res.status(201).json({ purchaseOrder: po });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'فشل إصدار أمر الشراء' });
  }
});

// ----------------------------------------------------
// GOODS RECEIPT (GRN)
// ----------------------------------------------------
router.post('/goods-receipt', authenticateToken, requireRoles(['SUPER_ADMIN', 'WAREHOUSE_MANAGER', 'PROCUREMENT_MANAGER']), async (req: Request, res: Response) => {
  try {
    const { purchaseOrderId, warehouseId, supplierDeliveryNote, items } = req.body;

    if (!purchaseOrderId || !items || !items.length) {
      return res.status(400).json({ error: 'أمر الشراء وبنود الاستلام مطلوبة' });
    }

    const po = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: { supplier: true },
    });

    if (!po) {
      return res.status(404).json({ error: 'أمر الشراء غير موجود' });
    }

    const targetWarehouseId = warehouseId || (await prisma.warehouse.findFirst())?.id;
    if (!targetWarehouseId) {
      return res.status(500).json({ error: 'لا يوجد مخزن متاح للاستلام' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const grCount = await tx.goodsReceipt.count();
      const receiptNumber = `GR-2026-${String(grCount + 1).padStart(4, '0')}`;

      // Create Goods Receipt
      const goodsReceipt = await tx.goodsReceipt.create({
        data: {
          receiptNumber,
          purchaseOrderId: po.id,
          supplierId: po.supplierId,
          warehouseId: targetWarehouseId,
          supplierDeliveryNote,
          receivedBy: req.user?.fullNameAr || 'أمين المخزن',
        },
      });

      for (const item of items) {
        const poItem = await tx.purchaseOrderItem.findUnique({
          where: { id: item.purchaseOrderItemId },
          include: { product: true },
        });

        if (!poItem) continue;

        const qtyRec = Number(item.quantityReceived);

        // Record GR Item
        await tx.goodsReceiptItem.create({
          data: {
            goodsReceiptId: goodsReceipt.id,
            purchaseOrderItemId: poItem.id,
            quantityReceived: qtyRec,
            lotBatchNumber: item.lotBatchNumber || `LOT-${Date.now().toString().slice(-6)}`,
            qualityStatus: 'ACCEPTED',
          },
        });

        // Update PO Item quantity received
        await tx.purchaseOrderItem.update({
          where: { id: poItem.id },
          data: { quantityReceived: poItem.quantityReceived + qtyRec },
        });

        // Update inventory
        let inv = await tx.inventory.findUnique({
          where: { warehouseId_productId: { warehouseId: targetWarehouseId, productId: poItem.productId } },
        });

        if (!inv) {
          inv = await tx.inventory.create({
            data: {
              warehouseId: targetWarehouseId,
              productId: poItem.productId,
              quantityOnHand: 0,
              quantityReserved: 0,
              quantityAvailable: 0,
              averageUnitCostEgp: poItem.unitPriceEgp,
            },
          });
        }

        const newOnHand = inv.quantityOnHand + qtyRec;
        const newAvailable = newOnHand - inv.quantityReserved;

        await tx.inventory.update({
          where: { id: inv.id },
          data: {
            quantityOnHand: newOnHand,
            quantityAvailable: newAvailable,
          },
        });

        // Create Stock Movement
        const smCount = await tx.stockMovement.count();
        await tx.stockMovement.create({
          data: {
            movementNumber: `SM-RCV-${smCount + 1}`,
            warehouseId: targetWarehouseId,
            productId: poItem.productId,
            movementType: 'PO_RECEIPT',
            quantity: qtyRec,
            unitCostEgp: poItem.unitPriceEgp,
            totalCostEgp: qtyRec * poItem.unitPriceEgp,
            referenceType: 'PurchaseOrder',
            referenceId: po.id,
            batchLotNumber: item.lotBatchNumber || null,
            performedBy: req.user?.fullNameAr || 'أمين المخزن',
            notes: `استلام خامات من المورد ${po.supplier.nameAr} بناء على إذن توريد: ${supplierDeliveryNote || ''}`,
          },
        });
      }

      // Check if PO is completely received
      const updatedPo = await tx.purchaseOrder.findUnique({
        where: { id: po.id },
        include: { items: true },
      });

      const allReceived = updatedPo?.items.every((it) => it.quantityReceived >= it.quantity);
      await tx.purchaseOrder.update({
        where: { id: po.id },
        data: { status: allReceived ? 'COMPLETED' : 'PARTIALLY_RECEIVED' },
      });

      return goodsReceipt;
    });

    await logAudit(req, 'CREATE', 'GoodsReceipt', result.id, `استلام شحنة خامات بإذن استلام ${result.receiptNumber}`);
    return res.status(201).json({ goodsReceipt: result });
  } catch (error: any) {
    console.error('Goods receipt error:', error);
    return res.status(500).json({ error: error.message || 'فشل تسجيل إذن الاستلام' });
  }
});

export default router;
