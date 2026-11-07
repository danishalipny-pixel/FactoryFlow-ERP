import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { authenticateToken, requireRoles } from '../middleware/auth';
import { logAudit } from '../middleware/audit';

const router = Router();

// List Production Orders
router.get('/orders', authenticateToken, async (req: Request, res: Response) => {
  try {
    const orders = await prisma.productionOrder.findMany({
      include: {
        product: true,
        salesOrder: {
          include: { customer: true },
        },
        operations: {
          include: {
            workCenter: true,
            assignedEmployee: true,
          },
          orderBy: { sequenceOrder: 'asc' },
        },
        materialRequirements: {
          include: { materialProduct: true },
        },
        qualityInspections: true,
      },
      orderBy: { plannedDueDate: 'asc' },
    });
    return res.json({ orders });
  } catch (error) {
    return res.status(500).json({ error: 'فشل استرجاع أوامر الإنتاج' });
  }
});

// Single Production Order Details
router.get('/orders/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const order = await prisma.productionOrder.findUnique({
      where: { id: req.params.id },
      include: {
        product: true,
        salesOrder: {
          include: { customer: true },
        },
        operations: {
          include: {
            workCenter: true,
            assignedEmployee: true,
          },
          orderBy: { sequenceOrder: 'asc' },
        },
        materialRequirements: {
          include: { materialProduct: true },
        },
        qualityInspections: {
          include: { inspector: true, defects: true },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'أمر الإنتاج غير موجود' });
    }

    return res.json({ order });
  } catch (error) {
    return res.status(500).json({ error: 'فشل استرجاع بيانات أمر الإنتاج' });
  }
});

// Update Job Card / Operation Progress
router.post('/operations/:id/update-status', authenticateToken, requireRoles(['SUPER_ADMIN', 'PRODUCTION_MANAGER', 'PRODUCTION_OPERATOR']), async (req: Request, res: Response) => {
  try {
    const { status, actualHours, goodQuantity, scrapQuantity, notes, assignedEmployeeId } = req.body;
    const opId = req.params.id;

    const op = await prisma.productionOperation.findUnique({
      where: { id: opId },
      include: {
        productionOrder: true,
        workCenter: true,
      },
    });

    if (!op) {
      return res.status(404).json({ error: 'مرحلة التشغيل غير موجودة' });
    }

    const updateData: any = { status };
    if (assignedEmployeeId) updateData.assignedEmployeeId = assignedEmployeeId;
    if (notes) updateData.notes = notes;

    if (status === 'IN_PROGRESS' && !op.startTime) {
      updateData.startTime = new Date();
    }

    if (status === 'COMPLETED') {
      updateData.endTime = new Date();
      updateData.actualHours = Number(actualHours) || op.plannedHours;
      updateData.goodQuantity = Number(goodQuantity) || op.productionOrder.plannedQuantity;
      updateData.scrapQuantity = Number(scrapQuantity) || 0;

      // Recalculate actual labor and overhead cost on Production Order
      const laborRate = 75.0; // standard hourly labor
      const wcRate = op.workCenter.hourlyCostRateEgp || 180.0;
      const additionalLaborCost = updateData.actualHours * laborRate;
      const additionalOverheadCost = updateData.actualHours * wcRate;

      await prisma.productionOrder.update({
        where: { id: op.productionOrderId },
        data: {
          actualLaborCostEgp: op.productionOrder.actualLaborCostEgp + additionalLaborCost,
          actualOverheadCostEgp: op.productionOrder.actualOverheadCostEgp + additionalOverheadCost,
          totalActualCostEgp: op.productionOrder.totalActualCostEgp + additionalLaborCost + additionalOverheadCost,
        },
      });
    }

    const updatedOp = await prisma.productionOperation.update({
      where: { id: opId },
      data: updateData,
      include: { workCenter: true, assignedEmployee: true },
    });

    await logAudit(req, 'UPDATE', 'ProductionOperation', opId, `تحديث حالة مرحلة التشغيل ${op.operationNameAr} إلى ${status}`);
    return res.json({ operation: updatedOp });
  } catch (error) {
    console.error('Update operation error:', error);
    return res.status(500).json({ error: 'فشل تحديث بطاقة العملية' });
  }
});

// Issue Material to Production Order (Consuming Reserved Stock)
router.post('/orders/:id/issue-material', authenticateToken, requireRoles(['SUPER_ADMIN', 'WAREHOUSE_MANAGER', 'PRODUCTION_MANAGER']), async (req: Request, res: Response) => {
  try {
    const { materialRequirementId, quantityToIssue, warehouseId } = req.body;
    const prodOrderId = req.params.id;

    const reqRecord = await prisma.materialRequirement.findUnique({
      where: { id: materialRequirementId },
      include: { materialProduct: true },
    });

    if (!reqRecord) {
      return res.status(404).json({ error: 'بند متطلبات الخامة غير موجود' });
    }

    const issueQty = Number(quantityToIssue);
    if (issueQty <= 0) {
      return res.status(400).json({ error: 'الكمية المصروفة يجب أن تكون أكبر من صفر' });
    }

    const prodOrder = await prisma.productionOrder.findUnique({ where: { id: prodOrderId } });
    if (!prodOrder) {
      return res.status(404).json({ error: 'أمر الإنتاج غير موجود' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Find inventory
      const inv = await tx.inventory.findFirst({
        where: { productId: reqRecord.materialProductId },
      });

      if (!inv || inv.quantityOnHand < issueQty) {
        throw new Error('الرصيد الفعلي في المخزن غير كافٍ للصرف (Negative inventory prevented)');
      }

      // Deduct from on-hand and reserved
      const newOnHand = inv.quantityOnHand - issueQty;
      const newReserved = Math.max(0, inv.quantityReserved - issueQty);
      const newAvailable = newOnHand - newReserved;

      await tx.inventory.update({
        where: { id: inv.id },
        data: {
          quantityOnHand: newOnHand,
          quantityReserved: newReserved,
          quantityAvailable: newAvailable,
        },
      });

      // Update Material Requirement
      const newIssued = reqRecord.issuedQuantity + issueQty;
      const newStatus = newIssued >= reqRecord.requiredQuantity ? 'ISSUED' : 'PARTIALLY_ISSUED';

      await tx.materialRequirement.update({
        where: { id: reqRecord.id },
        data: {
          issuedQuantity: newIssued,
          status: newStatus,
        },
      });

      // Update actual material cost on Production Order
      const materialCostDelta = issueQty * reqRecord.unitCostEgp;
      await tx.productionOrder.update({
        where: { id: prodOrderId },
        data: {
          actualMaterialCostEgp: prodOrder.actualMaterialCostEgp + materialCostDelta,
          totalActualCostEgp: prodOrder.totalActualCostEgp + materialCostDelta,
        },
      });

      // Create Stock Movement record
      const moveCount = await tx.stockMovement.count();
      await tx.stockMovement.create({
        data: {
          movementNumber: `SM-ISSUE-${moveCount + 1}`,
          warehouseId: inv.warehouseId,
          productId: reqRecord.materialProductId,
          movementType: 'PROD_ISSUE',
          quantity: -issueQty,
          unitCostEgp: reqRecord.unitCostEgp,
          totalCostEgp: materialCostDelta,
          referenceType: 'ProductionOrder',
          referenceId: prodOrderId,
          performedBy: req.user?.fullNameAr || 'أمين المخزن',
          notes: `صرف خامات لأمر الإنتاج ${prodOrder.orderNumber}`,
        },
      });

      return { newOnHand, newIssued };
    });

    await logAudit(req, 'ISSUE', 'ProductionOrder', prodOrderId, `صرف ${issueQty} ${reqRecord.materialProduct.unit} من الخامة ${reqRecord.materialProduct.nameAr}`);
    return res.json({ success: true, ...result });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'فشل صرف الخامات للإنتاج' });
  }
});

// Complete Production Order & Send to Final Inspection
router.post('/orders/:id/complete', authenticateToken, requireRoles(['SUPER_ADMIN', 'PRODUCTION_MANAGER']), async (req: Request, res: Response) => {
  try {
    const prodOrderId = req.params.id;
    const { completedQuantity, scrappedQuantity, notes } = req.body;

    const prodOrder = await prisma.productionOrder.update({
      where: { id: prodOrderId },
      data: {
        status: 'QC_INSPECTION',
        completedQuantity: Number(completedQuantity),
        scrappedQuantity: Number(scrappedQuantity) || 0,
        actualCompletionDate: new Date(),
        notes,
      },
      include: { product: true, salesOrder: true },
    });

    // Auto-create final QC inspection record
    const qcCount = await prisma.qualityInspection.count();
    await prisma.qualityInspection.create({
      data: {
        inspectionNumber: `QC-FIN-${String(qcCount + 1).padStart(4, '0')}`,
        type: 'FINAL_PRODUCT',
        referenceType: 'ProductionOrder',
        referenceId: prodOrderId,
        productionOrderId: prodOrderId,
        productId: prodOrder.productId,
        inspectedQuantity: Number(completedQuantity),
        passedQuantity: Number(completedQuantity),
        rejectedQuantity: 0,
        result: 'PASSED',
        notes: `فحص نهائي بعد اكتمال تصنيع أمر الإنتاج ${prodOrder.orderNumber}`,
      },
    });

    await logAudit(req, 'UPDATE', 'ProductionOrder', prodOrderId, `اكتمال تصنيع ${completedQuantity} وتحويلها للتفتيش النهائي`);
    return res.json({ productionOrder: prodOrder });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'فشل إتمام أمر الإنتاج' });
  }
});

export default router;
