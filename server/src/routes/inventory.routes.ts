import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { authenticateToken, requireRoles } from '../middleware/auth';
import { logAudit } from '../middleware/audit';

const router = Router();

// Warehouses list
router.get('/warehouses', authenticateToken, async (req: Request, res: Response) => {
  try {
    const warehouses = await prisma.warehouse.findMany({
      include: {
        inventoryItems: {
          include: { product: true },
        },
      },
      orderBy: { code: 'asc' },
    });
    return res.json({ warehouses });
  } catch (error) {
    return res.status(500).json({ error: 'فشل استرجاع بيانات المستودعات' });
  }
});

// Real-time Stock Inventory
router.get('/stock', authenticateToken, async (req: Request, res: Response) => {
  try {
    const stock = await prisma.inventory.findMany({
      include: {
        product: true,
        warehouse: true,
      },
      orderBy: { product: { itemCode: 'asc' } },
    });
    return res.json({ stock });
  } catch (error) {
    return res.status(500).json({ error: 'فشل استرجاع أرصدة المخازن' });
  }
});

// Material Reservations (MTO Allocated stock)
router.get('/reservations', authenticateToken, async (req: Request, res: Response) => {
  try {
    const reservations = await prisma.materialReservation.findMany({
      include: {
        salesOrder: {
          include: { customer: true },
        },
        productionOrder: true,
        materialProduct: true,
      },
      orderBy: { reservedAt: 'desc' },
    });
    return res.json({ reservations });
  } catch (error) {
    return res.status(500).json({ error: 'فشل استرجاع حجوزات المواد' });
  }
});

// Stock Movements Audit Trail
router.get('/movements', authenticateToken, async (req: Request, res: Response) => {
  try {
    const movements = await prisma.stockMovement.findMany({
      include: {
        product: true,
        warehouse: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return res.json({ movements });
  } catch (error) {
    return res.status(500).json({ error: 'فشل استرجاع حركة المخازن' });
  }
});

// Stock Adjustment (requires WAREHOUSE_MANAGER or higher)
router.post('/adjustments', authenticateToken, requireRoles(['SUPER_ADMIN', 'WAREHOUSE_MANAGER', 'FACTORY_OWNER']), async (req: Request, res: Response) => {
  try {
    const { warehouseId, productId, adjustmentQuantity, reason } = req.body;
    const qty = Number(adjustmentQuantity);

    if (!warehouseId || !productId || isNaN(qty) || qty === 0) {
      return res.status(400).json({ error: 'بيانات التسوية المخزنية غير مكتملة' });
    }

    const result = await prisma.$transaction(async (tx) => {
      let inv = await tx.inventory.findUnique({
        where: { warehouseId_productId: { warehouseId, productId } },
      });

      if (!inv) {
        inv = await tx.inventory.create({
          data: {
            warehouseId,
            productId,
            quantityOnHand: 0,
            quantityReserved: 0,
            quantityAvailable: 0,
          },
        });
      }

      const newOnHand = inv.quantityOnHand + qty;
      if (newOnHand < inv.quantityReserved) {
        throw new Error('لا يمكن تسوية الرصيد لأقل من الكميات المحجوزة لأوامر الإنتاج (Reserved stock protection)');
      }

      const newAvailable = newOnHand - inv.quantityReserved;

      await tx.inventory.update({
        where: { id: inv.id },
        data: {
          quantityOnHand: newOnHand,
          quantityAvailable: newAvailable,
          lastCountDate: new Date(),
        },
      });

      const moveCount = await tx.stockMovement.count();
      const movement = await tx.stockMovement.create({
        data: {
          movementNumber: `SM-ADJ-${moveCount + 1}`,
          warehouseId,
          productId,
          movementType: 'ADJUSTMENT',
          quantity: qty,
          unitCostEgp: inv.averageUnitCostEgp,
          totalCostEgp: Math.abs(qty * inv.averageUnitCostEgp),
          performedBy: req.user?.fullNameAr || 'أمين المخزن',
          notes: reason || 'تسوية جردية دورية',
        },
      });

      return { newOnHand, newAvailable, movement };
    });

    await logAudit(req, 'UPDATE', 'Inventory', productId, `تسوية مخزنية بمقدار ${qty}: ${reason}`);
    return res.json({ success: true, ...result });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'فشل إجراء التسوية المخزنية' });
  }
});

export default router;
