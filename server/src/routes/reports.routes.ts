import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Order Delivery & Lead Time Report
router.get('/orders-performance', authenticateToken, async (req: Request, res: Response) => {
  try {
    const orders = await prisma.salesOrder.findMany({
      include: {
        customer: true,
        productionOrders: true,
        invoices: true,
      },
      orderBy: { orderDate: 'desc' },
    });

    const report = orders.map((so) => {
      const now = new Date();
      const isDelayed = so.status !== 'COMPLETED' && so.status !== 'DELIVERED' && new Date(so.deliveryDeadline) < now;
      const totalProdCost = so.productionOrders.reduce((sum, po) => sum + po.totalActualCostEgp, 0);

      return {
        orderNumber: so.orderNumber,
        customerNameAr: so.customer.nameAr,
        customerNameEn: so.customer.nameEn,
        customerName: so.customer.nameAr,
        orderDate: so.orderDate,
        deliveryDeadline: so.deliveryDeadline,
        status: so.status,
        isDelayed,
        totalAmountEgp: so.totalAmountEgp,
        actualProductionCostEgp: totalProdCost,
        profitEgp: so.subtotalEgp - totalProdCost,
        invoicedAmountEgp: so.invoices.reduce((sum, inv) => sum + inv.totalAmountEgp, 0),
        paidAmountEgp: so.invoices.reduce((sum, inv) => sum + inv.paidAmountEgp, 0),
      };
    });

    return res.json({ report });
  } catch (error) {
    return res.status(500).json({ error: 'فشل استرجاع تقرير أداء الأوامر' });
  }
});

// Production Efficiency & Work Center Load Report
router.get('/production-efficiency', authenticateToken, async (req: Request, res: Response) => {
  try {
    const operations = await prisma.productionOperation.findMany({
      include: {
        workCenter: true,
        assignedEmployee: true,
        productionOrder: {
          include: { product: true },
        },
      },
      where: { status: 'COMPLETED' },
    });

    const summary = operations.map((op) => ({
      operationNameAr: op.operationNameAr,
      operationNameEn: op.operationNameEn || op.operationNameAr,
      operationName: op.operationNameAr,
      workCenterAr: op.workCenter.nameAr,
      workCenterEn: op.workCenter.nameEn,
      workCenter: op.workCenter.nameAr,
      employeeAr: op.assignedEmployee ? `${op.assignedEmployee.firstNameAr} ${op.assignedEmployee.lastNameAr}` : 'فني التشغيل',
      employeeEn: op.assignedEmployee ? `${op.assignedEmployee.firstNameEn || op.assignedEmployee.firstNameAr} ${op.assignedEmployee.lastNameEn || op.assignedEmployee.lastNameAr}` : 'Production Operator',
      employee: op.assignedEmployee ? `${op.assignedEmployee.firstNameAr} ${op.assignedEmployee.lastNameAr}` : 'فني التشغيل',
      plannedHours: op.plannedHours,
      actualHours: op.actualHours,
      efficiencyRatio: op.plannedHours > 0 && op.actualHours > 0 ? Math.round((op.plannedHours / op.actualHours) * 100) : 100,
      goodQuantity: op.goodQuantity,
      scrapQuantity: op.scrapQuantity,
      scrapRatePercent: (op.goodQuantity + op.scrapQuantity) > 0 ? Math.round((op.scrapQuantity / (op.goodQuantity + op.scrapQuantity)) * 100 * 10) / 10 : 0,
    }));

    return res.json({ summary });
  } catch (error) {
    return res.status(500).json({ error: 'فشل استرجاع تقرير كفاءة الإنتاج' });
  }
});

export default router;
