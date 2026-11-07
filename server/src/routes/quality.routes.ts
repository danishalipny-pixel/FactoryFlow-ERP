import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { authenticateToken, requireRoles } from '../middleware/auth';
import { logAudit } from '../middleware/audit';

const router = Router();

// Inspections list
router.get('/inspections', authenticateToken, async (req: Request, res: Response) => {
  try {
    const inspections = await prisma.qualityInspection.findMany({
      include: {
        product: true,
        inspector: true,
        productionOrder: {
          include: { salesOrder: { include: { customer: true } } },
        },
        defects: true,
      },
      orderBy: { inspectionDate: 'desc' },
    });
    return res.json({ inspections });
  } catch (error) {
    return res.status(500).json({ error: 'فشل استرجاع سجلات فحص الجودة' });
  }
});

// Create Quality Inspection
router.post('/inspections', authenticateToken, requireRoles(['SUPER_ADMIN', 'QUALITY_INSPECTOR', 'PRODUCTION_MANAGER']), async (req: Request, res: Response) => {
  try {
    const { type, referenceType, referenceId, productionOrderId, productId, inspectedQuantity, passedQuantity, rejectedQuantity, result, notes, defects } = req.body;

    if (!type || !productId || !inspectedQuantity || !result) {
      return res.status(400).json({ error: 'نوع الفحص والمنتج والكمية والنتيجة مطلوبة' });
    }

    const count = await prisma.qualityInspection.count();
    const inspectionNumber = `QC-${type === 'FINAL_PRODUCT' ? 'FIN' : type === 'IN_PROCESS' ? 'INP' : 'MAT'}-2026-${String(count + 1).padStart(4, '0')}`;

    const inspector = await prisma.employee.findFirst({
      where: { department: { code: 'QC' } },
    });

    const inspection = await prisma.qualityInspection.create({
      data: {
        inspectionNumber,
        type,
        referenceType: referenceType || 'ProductionOrder',
        referenceId: referenceId || productionOrderId || 'N/A',
        productionOrderId: productionOrderId || null,
        productId,
        inspectorId: inspector?.id || null,
        inspectedQuantity: Number(inspectedQuantity),
        passedQuantity: Number(passedQuantity),
        rejectedQuantity: Number(rejectedQuantity) || 0,
        result,
        notes,
        defects: defects && defects.length ? {
          create: defects.map((d: any) => ({
            defectCode: d.defectCode || 'DEF-GENERAL',
            descriptionAr: d.descriptionAr,
            descriptionEn: d.descriptionEn || d.descriptionAr,
            severity: d.severity || 'MINOR',
            quantityAffected: Number(d.quantityAffected) || 1,
            actionTaken: d.actionTaken || 'REWORK',
          })),
        } : undefined,
      },
      include: { product: true, defects: true },
    });

    await logAudit(req, 'CREATE', 'QualityInspection', inspection.id, `تسجيل فحص جودة رقم ${inspectionNumber} بالنتيجة: ${result}`);
    return res.status(201).json({ inspection });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'فشل تسجيل فحص الجودة' });
  }
});

export default router;
