import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { authenticateToken, requireRoles } from '../middleware/auth';
import { logAudit } from '../middleware/audit';

const router = Router();

// ----------------------------------------------------
// PRODUCTS CATALOG
// ----------------------------------------------------
router.get('/products', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const where = category ? { category: String(category) } : {};

    const products = await prisma.product.findMany({
      where,
      include: {
        bom: {
          include: {
            items: {
              include: { component: true },
            },
          },
        },
        routing: {
          include: {
            operations: {
              include: { workCenter: true },
              orderBy: { sequenceOrder: 'asc' },
            },
          },
        },
        inventoryItems: {
          include: { warehouse: true },
        },
      },
      orderBy: { itemCode: 'asc' },
    });
    return res.json({ products });
  } catch (error) {
    return res.status(500).json({ error: 'فشل استرجاع المنتجات' });
  }
});

router.post('/products', authenticateToken, requireRoles(['SUPER_ADMIN', 'PRODUCTION_MANAGER', 'FACTORY_OWNER']), async (req: Request, res: Response) => {
  try {
    const { itemCode, nameAr, nameEn, description, category, unit, standardCostEgp, sellingPriceEgp, drawingNumber, revision, safetyStock } = req.body;

    if (!itemCode || !nameAr || !category || !unit) {
      return res.status(400).json({ error: 'كود المنتج والاسم والتصنيف ووحدة القياس مطلوبة' });
    }

    const product = await prisma.product.create({
      data: {
        itemCode,
        nameAr,
        nameEn: nameEn || nameAr,
        description,
        category,
        unit,
        standardCostEgp: Number(standardCostEgp) || 0,
        sellingPriceEgp: Number(sellingPriceEgp) || 0,
        drawingNumber,
        revision: revision || 'Rev.01',
        safetyStock: Number(safetyStock) || 0,
      },
    });

    await logAudit(req, 'CREATE', 'Product', product.id, `إضافة منتج/خامة جديدة: ${itemCode} - ${nameAr}`);
    return res.status(201).json({ product });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'فشل حفظ المنتج' });
  }
});

// ----------------------------------------------------
// WORK CENTERS
// ----------------------------------------------------
router.get('/work-centers', authenticateToken, async (req: Request, res: Response) => {
  try {
    const workCenters = await prisma.workCenter.findMany({
      include: {
        department: true,
        factory: true,
        _count: {
          select: { productionOperations: true, routingOperations: true },
        },
      },
      orderBy: { code: 'asc' },
    });
    return res.json({ workCenters });
  } catch (error) {
    return res.status(500).json({ error: 'فشل استرجاع مراكز التشغيل' });
  }
});

router.post('/work-centers', authenticateToken, requireRoles(['SUPER_ADMIN', 'PRODUCTION_MANAGER']), async (req: Request, res: Response) => {
  try {
    const { code, nameAr, nameEn, departmentId, capacityHoursPerDay, hourlyCostRateEgp, efficiencyPercent, status } = req.body;
    const factory = await prisma.factory.findFirst();

    const wc = await prisma.workCenter.create({
      data: {
        factoryId: factory!.id,
        departmentId: departmentId || null,
        code,
        nameAr,
        nameEn: nameEn || nameAr,
        capacityHoursPerDay: Number(capacityHoursPerDay) || 16.0,
        hourlyCostRateEgp: Number(hourlyCostRateEgp) || 150.0,
        efficiencyPercent: Number(efficiencyPercent) || 90.0,
        status: status || 'OPERATIONAL',
      },
    });

    await logAudit(req, 'CREATE', 'WorkCenter', wc.id, `إضافة مركز تشغيل: ${code} - ${nameAr}`);
    return res.status(201).json({ workCenter: wc });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'فشل إنشاء مركز التشغيل' });
  }
});

// ----------------------------------------------------
// BILL OF MATERIALS (BOM)
// ----------------------------------------------------
router.get('/boms', authenticateToken, async (req: Request, res: Response) => {
  try {
    const boms = await prisma.bOM.findMany({
      include: {
        product: true,
        items: {
          include: { component: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return res.json({ boms });
  } catch (error) {
    return res.status(500).json({ error: 'فشل استرجاع شجرة المنتجات (BOM)' });
  }
});

router.post('/boms', authenticateToken, requireRoles(['SUPER_ADMIN', 'PRODUCTION_MANAGER', 'FACTORY_OWNER']), async (req: Request, res: Response) => {
  try {
    const { productId, nameAr, nameEn, version, yieldPercent, items } = req.body;

    if (!productId || !items || !items.length) {
      return res.status(400).json({ error: 'المنتج ومكونات الشجرة مطلوبة' });
    }

    // Calculate estimated material cost
    let totalEstCost = 0;
    const itemsData = [];

    for (const item of items) {
      const comp = await prisma.product.findUnique({ where: { id: item.componentId } });
      const compCost = comp ? comp.standardCostEgp : 0;
      totalEstCost += Number(item.quantity) * compCost * (1 + ((Number(item.scrapPercentage) || 0) / 100));
      itemsData.push({
        componentId: item.componentId,
        quantity: Number(item.quantity),
        unit: item.unit || comp?.unit || 'KG',
        scrapPercentage: Number(item.scrapPercentage) || 2.0,
        notes: item.notes || null,
      });
    }

    const bom = await prisma.bOM.create({
      data: {
        productId,
        nameAr,
        nameEn: nameEn || nameAr,
        version: version || '1.0',
        yieldPercent: Number(yieldPercent) || 100.0,
        estimatedMaterialCost: Math.round(totalEstCost * 100) / 100,
        items: {
          create: itemsData,
        },
      },
      include: { product: true, items: { include: { component: true } } },
    });

    await logAudit(req, 'CREATE', 'BOM', bom.id, `إنشاء شجرة منتج: ${nameAr}`);
    return res.status(201).json({ bom });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'فشل حفظ شجرة المنتج' });
  }
});

export default router;
