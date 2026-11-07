import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/metrics', authenticateToken, async (req: Request, res: Response) => {
  try {
    const now = new Date();

    // Counts
    const [
      totalSalesOrders,
      activeProductionOrders,
      pendingQuotations,
      shortagesCount,
      customersCount,
      completedProductionOrders,
    ] = await Promise.all([
      prisma.salesOrder.count(),
      prisma.productionOrder.count({ where: { status: { in: ['RELEASED', 'IN_PROGRESS', 'QC_INSPECTION'] } } }),
      prisma.quotation.count({ where: { status: 'SENT' } }),
      prisma.materialRequirement.count({ where: { status: 'SHORTAGE' } }),
      prisma.customer.count(),
      prisma.productionOrder.count({ where: { status: 'COMPLETED' } }),
    ]);

    // Financial Metrics
    const invoices = await prisma.invoice.findMany({
      select: { totalAmountEgp: true, paidAmountEgp: true, subtotalEgp: true },
    });
    const totalInvoicedEgp = invoices.reduce((sum, inv) => sum + inv.totalAmountEgp, 0);
    const totalCollectedEgp = invoices.reduce((sum, inv) => sum + inv.paidAmountEgp, 0);
    const accountsReceivableEgp = totalInvoicedEgp - totalCollectedEgp;

    // Production Orders with Costing and Deadlines
    const productionOrders = await prisma.productionOrder.findMany({
      include: {
        product: { select: { nameAr: true, nameEn: true, itemCode: true } },
        salesOrder: {
          include: {
            customer: { select: { nameAr: true, nameEn: true } },
          },
        },
        operations: {
          include: {
            workCenter: { select: { nameAr: true, nameEn: true, code: true } },
          },
        },
      },
      orderBy: { plannedDueDate: 'asc' },
    });

    // Delayed Orders (where plannedDueDate < now and status is not completed)
    const delayedOrders = productionOrders.filter(
      (po) => new Date(po.plannedDueDate) < now && po.status !== 'COMPLETED'
    );

    // Active Shortages Details
    const materialShortages = await prisma.materialRequirement.findMany({
      where: { status: 'SHORTAGE' },
      include: {
        materialProduct: { select: { itemCode: true, nameAr: true, nameEn: true, unit: true } },
        productionOrder: {
          select: {
            orderNumber: true,
            salesOrder: {
              select: { orderNumber: true, customer: { select: { nameAr: true, nameEn: true } } },
            },
          },
        },
      },
    });

    // Order Profitability Analysis
    const profitabilityList = await prisma.productionOrder.findMany({
      include: {
        product: { select: { nameAr: true, nameEn: true, itemCode: true, sellingPriceEgp: true } },
        salesOrder: {
          select: {
            orderNumber: true,
            totalAmountEgp: true,
            customer: { select: { nameAr: true, nameEn: true } },
          },
        },
      },
      take: 6,
    });

    const orderProfitability = profitabilityList.map((po) => {
      const revenue = po.salesOrder?.totalAmountEgp || (po.plannedQuantity * po.product.sellingPriceEgp);
      const actualCost = po.totalActualCostEgp || (po.plannedMaterialCostEgp + po.plannedLaborCostEgp + po.plannedOverheadCostEgp);
      const grossProfit = revenue - actualCost;
      const marginPercent = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

      return {
        orderNumber: po.orderNumber,
        soNumber: po.salesOrder?.orderNumber,
        customerNameAr: po.salesOrder?.customer.nameAr,
        customerNameEn: po.salesOrder?.customer.nameEn,
        productNameAr: po.product.nameAr,
        productNameEn: po.product.nameEn,
        revenueEgp: revenue,
        actualCostEgp: actualCost,
        grossProfitEgp: grossProfit,
        marginPercent: Math.round(marginPercent * 10) / 10,
        status: po.status,
      };
    });

    // Work Centers Load & Utilization
    const workCenters = await prisma.workCenter.findMany({
      include: {
        productionOperations: {
          where: { status: 'IN_PROGRESS' },
        },
      },
    });

    const workCenterLoads = workCenters.map((wc) => ({
      id: wc.id,
      code: wc.code,
      nameAr: wc.nameAr,
      nameEn: wc.nameEn,
      capacityHours: wc.capacityHoursPerDay,
      hourlyCost: wc.hourlyCostRateEgp,
      activeJobsCount: wc.productionOperations.length,
      status: wc.status,
    }));

    return res.json({
      summary: {
        totalSalesOrders,
        activeProductionOrders,
        pendingQuotations,
        shortagesCount,
        customersCount,
        completedProductionOrders,
        totalInvoicedEgp,
        totalCollectedEgp,
        accountsReceivableEgp,
        delayedOrdersCount: delayedOrders.length,
      },
      delayedOrders: delayedOrders.map((d) => ({
        id: d.id,
        orderNumber: d.orderNumber,
        customerNameAr: d.salesOrder?.customer.nameAr,
        customerNameEn: d.salesOrder?.customer.nameEn,
        productNameAr: d.product.nameAr,
        productNameEn: d.product.nameEn,
        plannedDueDate: d.plannedDueDate,
        progress: d.plannedQuantity > 0 ? Math.round((d.completedQuantity / d.plannedQuantity) * 100) : 0,
        status: d.status,
      })),
      materialShortages: materialShortages.map((ms) => ({
        id: ms.id,
        itemCode: ms.materialProduct.itemCode,
        materialNameAr: ms.materialProduct.nameAr,
        materialNameEn: ms.materialProduct.nameEn,
        shortageQuantity: ms.shortageQuantity,
        unit: ms.materialProduct.unit,
        productionOrderNumber: ms.productionOrder.orderNumber,
        salesOrderNumber: ms.productionOrder.salesOrder?.orderNumber,
        customerNameAr: ms.productionOrder.salesOrder?.customer.nameAr,
        customerNameEn: ms.productionOrder.salesOrder?.customer.nameEn,
      })),
      orderProfitability,
      workCenterLoads,
    });
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    return res.status(500).json({ error: 'Failed to retrieve dashboard metrics' });
  }
});

export default router;
