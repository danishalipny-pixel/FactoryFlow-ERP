import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { authenticateToken, requireRoles } from '../middleware/auth';
import { logAudit } from '../middleware/audit';

const router = Router();

// ----------------------------------------------------
// CUSTOMERS
// ----------------------------------------------------
router.get('/customers', authenticateToken, async (req: Request, res: Response) => {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        _count: {
          select: { salesOrders: true, quotations: true, invoices: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ customers });
  } catch (error) {
    return res.status(500).json({ error: 'فشل استرجاع قائمة العملاء' });
  }
});

router.post('/customers', authenticateToken, requireRoles(['SUPER_ADMIN', 'SALES_MANAGER', 'FACTORY_OWNER']), async (req: Request, res: Response) => {
  try {
    const { nameAr, nameEn, taxRegistrationNo, commercialRegNo, contactPerson, email, phone, address, city, governorate, paymentTermsDays, creditLimitEgp } = req.body;

    if (!nameAr) {
      return res.status(400).json({ error: 'اسم العميل باللغة العربية مطلوب' });
    }

    const count = await prisma.customer.count();
    const code = `CUST-EGY-${String(count + 1).padStart(3, '0')}`;

    const customer = await prisma.customer.create({
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
        city: city || 'القاهرة',
        governorate: governorate || 'القاهرة',
        paymentTermsDays: Number(paymentTermsDays) || 30,
        creditLimitEgp: Number(creditLimitEgp) || 500000,
      },
    });

    await logAudit(req, 'CREATE', 'Customer', customer.id, `إنشاء عميل جديد: ${nameAr}`);
    return res.status(201).json({ customer });
  } catch (error) {
    console.error('Create customer error:', error);
    return res.status(500).json({ error: 'فشل إنشاء العميل' });
  }
});

// ----------------------------------------------------
// QUOTATIONS
// ----------------------------------------------------
router.get('/quotations', authenticateToken, async (req: Request, res: Response) => {
  try {
    const quotations = await prisma.quotation.findMany({
      include: {
        customer: true,
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ quotations });
  } catch (error) {
    return res.status(500).json({ error: 'فشل استرجاع عروض الأسعار' });
  }
});

router.post('/quotations', authenticateToken, requireRoles(['SUPER_ADMIN', 'SALES_MANAGER', 'FACTORY_OWNER']), async (req: Request, res: Response) => {
  try {
    const { customerId, validUntilWeeks, items, notes } = req.body;

    if (!customerId || !items || !items.length) {
      return res.status(400).json({ error: 'العميل وبنود العرض مطلوبة' });
    }

    const count = await prisma.quotation.count();
    const quoteNumber = `QUO-2026-${String(count + 1).padStart(4, '0')}`;

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + ((Number(validUntilWeeks) || 4) * 7));

    let subtotal = 0;
    const itemsData: any[] = [];

    for (const item of items) {
      const lineTotal = Number(item.quantity) * Number(item.unitPriceEgp);
      subtotal += lineTotal;
      itemsData.push({
        productId: item.productId,
        quantity: Number(item.quantity),
        unitPriceEgp: Number(item.unitPriceEgp),
        estimatedCostEgp: Number(item.estimatedCostEgp) || (Number(item.unitPriceEgp) * 0.7),
        marginPercent: Number(item.marginPercent) || 30.0,
        totalPriceEgp: lineTotal,
        notes: item.notes || null,
      });
    }

    const taxRatePercent = 14.0;
    const taxAmountEgp = (subtotal * taxRatePercent) / 100;
    const totalAmountEgp = subtotal + taxAmountEgp;

    const quotation = await prisma.quotation.create({
      data: {
        quoteNumber,
        customerId,
        validUntil,
        status: 'SENT',
        subtotalEgp: subtotal,
        taxRatePercent,
        taxAmountEgp,
        totalAmountEgp,
        estimatedDeliveryWeeks: Number(validUntilWeeks) || 3,
        notes,
        items: {
          create: itemsData,
        },
      },
      include: { customer: true, items: { include: { product: true } } },
    });

    await logAudit(req, 'CREATE', 'Quotation', quotation.id, `إصدار عرض أسعار رقم ${quoteNumber}`);
    return res.status(201).json({ quotation });
  } catch (error) {
    console.error('Create quotation error:', error);
    return res.status(500).json({ error: 'فشل إنشاء عرض الأسعار' });
  }
});

// ----------------------------------------------------
// CONFIRMED SALES ORDERS (THE MTO CORE TRIGGER)
// ----------------------------------------------------
router.get('/orders', authenticateToken, async (req: Request, res: Response) => {
  try {
    const orders = await prisma.salesOrder.findMany({
      include: {
        customer: true,
        items: {
          include: { product: true },
        },
        productionOrders: {
          include: {
            operations: true,
            materialRequirements: { include: { materialProduct: true } },
          },
        },
        invoices: true,
      },
      orderBy: { orderDate: 'desc' },
    });
    return res.json({ orders });
  } catch (error) {
    return res.status(500).json({ error: 'فشل استرجاع أوامر المبيعات' });
  }
});

// Confirm Sales Order and Automatically Trigger MTO Engine
router.post('/orders', authenticateToken, requireRoles(['SUPER_ADMIN', 'SALES_MANAGER', 'FACTORY_OWNER', 'GENERAL_MANAGER']), async (req: Request, res: Response) => {
  try {
    const { customerId, quotationId, deliveryDays, advancePaymentEgp, paymentTerms, notes, items } = req.body;

    if (!customerId || !items || !items.length) {
      return res.status(400).json({ error: 'العميل وبنود أمر البيع مطلوبة' });
    }

    const count = await prisma.salesOrder.count();
    const orderNumber = `SO-2026-${String(count + 1).padStart(4, '0')}`;

    const deliveryDeadline = new Date();
    deliveryDeadline.setDate(deliveryDeadline.getDate() + (Number(deliveryDays) || 30));

    let subtotal = 0;
    const itemsData: any[] = [];

    for (const item of items) {
      const lineTotal = Number(item.quantity) * Number(item.unitPriceEgp);
      subtotal += lineTotal;
      itemsData.push({
        productId: item.productId,
        quantity: Number(item.quantity),
        unitPriceEgp: Number(item.unitPriceEgp),
        totalPriceEgp: lineTotal,
        deliveryDate: deliveryDeadline,
        customSpecs: item.customSpecs || null,
      });
    }

    const taxRatePercent = 14.0;
    const taxAmountEgp = (subtotal * taxRatePercent) / 100;
    const whtRatePercent = 1.0;
    const whtAmountEgp = (subtotal * whtRatePercent) / 100;
    const totalAmountEgp = subtotal + taxAmountEgp - whtAmountEgp;

    // Default factory
    const factory = await prisma.factory.findFirst();
    if (!factory) {
      return res.status(500).json({ error: 'لا يوجد مصنع مسجل في النظام' });
    }

    // Execute MTO Lifecycle in a single ACID Transaction!
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Confirmed Sales Order
      const salesOrder = await tx.salesOrder.create({
        data: {
          orderNumber,
          customerId,
          quotationId: quotationId || null,
          deliveryDeadline,
          status: 'IN_PRODUCTION',
          subtotalEgp: subtotal,
          taxRatePercent,
          taxAmountEgp,
          whtRatePercent,
          whtAmountEgp,
          totalAmountEgp,
          advancePaymentEgp: Number(advancePaymentEgp) || 0,
          paymentTerms: paymentTerms || '50% دفعة مقدمة والباقي بعد الاستلام',
          notes,
          items: {
            create: itemsData,
          },
        },
        include: { items: true },
      });

      // If created from Quotation, mark quotation as ACCEPTED
      if (quotationId) {
        await tx.quotation.update({
          where: { id: quotationId },
          data: { status: 'ACCEPTED' },
        });
      }

      // 2. MTO Engine: For each item ordered, create linked Production Order & allocate materials!
      for (const item of salesOrder.items) {
        const prodCount = await tx.productionOrder.count();
        const prodOrderNumber = `PO-MTO-${orderNumber.replace('SO-', '')}-${prodCount + 1}`;

        // Get Product BOM & Routing
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: {
            bom: { include: { items: { include: { component: true } } } },
            routing: { include: { operations: { orderBy: { sequenceOrder: 'asc' } } } },
          },
        });

        let plannedMatCost = 0;
        let plannedLaborCost = 0;
        let plannedOverheadCost = 0;

        // Create Production Order
        const prodOrder = await tx.productionOrder.create({
          data: {
            orderNumber: prodOrderNumber,
            salesOrderId: salesOrder.id,
            salesOrderItemId: item.id,
            factoryId: factory.id,
            productId: item.productId,
            plannedQuantity: item.quantity,
            completedQuantity: 0,
            scrappedQuantity: 0,
            status: 'RELEASED',
            priority: 'HIGH',
            plannedStartDate: new Date(),
            plannedDueDate: deliveryDeadline,
            notes: `أمر تصنيع مخصص بناء على طلب العميل رقم ${orderNumber}`,
          },
        });

        // 3. BOM Explosion & Material Reservation
        if (product?.bom && product.bom.items.length > 0) {
          for (const bomItem of product.bom.items) {
            const scrapFactor = 1 + (bomItem.scrapPercentage / 100);
            const totalRequired = bomItem.quantity * item.quantity * scrapFactor;
            plannedMatCost += totalRequired * bomItem.component.standardCostEgp;

            // Check current inventory availability
            const invRecord = await tx.inventory.findFirst({
              where: { productId: bomItem.componentId },
            });

            const currentAvailable = invRecord ? invRecord.quantityAvailable : 0;
            let reservedQty = 0;
            let shortageQty = 0;

            if (currentAvailable >= totalRequired) {
              // Complete reserve
              reservedQty = totalRequired;
              shortageQty = 0;

              // Deduct from available, add to reserved in inventory
              if (invRecord) {
                await tx.inventory.update({
                  where: { id: invRecord.id },
                  data: {
                    quantityReserved: invRecord.quantityReserved + reservedQty,
                    quantityAvailable: invRecord.quantityOnHand - (invRecord.quantityReserved + reservedQty),
                  },
                });
              }

              // Create dedicated reservation record
              await tx.materialReservation.create({
                data: {
                  salesOrderId: salesOrder.id,
                  productionOrderId: prodOrder.id,
                  materialProductId: bomItem.componentId,
                  quantityReserved: reservedQty,
                  status: 'ACTIVE',
                },
              });
            } else {
              // Partial or complete shortage!
              reservedQty = Math.max(0, currentAvailable);
              shortageQty = totalRequired - reservedQty;

              if (invRecord && reservedQty > 0) {
                await tx.inventory.update({
                  where: { id: invRecord.id },
                  data: {
                    quantityReserved: invRecord.quantityReserved + reservedQty,
                    quantityAvailable: 0,
                  },
                });
              }

              // Generate automatic Purchase Request for the shortage!
              const prCount = await tx.purchaseRequest.count();
              const prNumber = `PR-MTO-SHORTAGE-${prCount + 1}`;

              await tx.purchaseRequest.create({
                data: {
                  requestNumber: prNumber,
                  salesOrderId: salesOrder.id,
                  requiredDate: deliveryDeadline,
                  status: 'PENDING',
                  priority: 'URGENT',
                  reason: `عجز خامات ناتج عن أمر المبيعات ${orderNumber} - الخامة: ${bomItem.component.nameAr}`,
                  items: {
                    create: [
                      {
                        productId: bomItem.componentId,
                        quantity: shortageQty,
                        estimatedUnitCostEgp: bomItem.component.standardCostEgp,
                        totalEstimatedEgp: shortageQty * bomItem.component.standardCostEgp,
                        notes: `مطلوب تصنيع أمر الإنتاج ${prodOrderNumber}`,
                      },
                    ],
                  },
                },
              });
            }

            // Record Material Requirement
            await tx.materialRequirement.create({
              data: {
                productionOrderId: prodOrder.id,
                materialProductId: bomItem.componentId,
                requiredQuantity: totalRequired,
                reservedQuantity: reservedQty,
                issuedQuantity: 0,
                shortageQuantity: shortageQty,
                unitCostEgp: bomItem.component.standardCostEgp,
                totalCostEgp: totalRequired * bomItem.component.standardCostEgp,
                status: shortageQty > 0 ? 'SHORTAGE' : 'RESERVED',
              },
            });
          }
        }

        // 4. Operations / Job Cards Generation from Routing
        if (product?.routing && product.routing.operations.length > 0) {
          for (const op of product.routing.operations) {
            const totalHours = (op.setupTimeMinutes + (op.runTimeMinutesPerUnit * item.quantity)) / 60;
            plannedLaborCost += totalHours * 80; // Avg labor rate
            plannedOverheadCost += totalHours * 150; // Avg machine overhead

            await tx.productionOperation.create({
              data: {
                productionOrderId: prodOrder.id,
                sequenceOrder: op.sequenceOrder,
                operationNameAr: op.nameAr,
                operationNameEn: op.nameEn,
                workCenterId: op.workCenterId,
                status: 'PENDING',
                plannedHours: Math.round(totalHours * 10) / 10,
                goodQuantity: 0,
                scrapQuantity: 0,
              },
            });
          }
        }

        // Update planned costs on Production Order
        await tx.productionOrder.update({
          where: { id: prodOrder.id },
          data: {
            plannedMaterialCostEgp: plannedMatCost,
            plannedLaborCostEgp: plannedLaborCost,
            plannedOverheadCostEgp: plannedOverheadCost,
          },
        });
      }

      return salesOrder;
    });

    await logAudit(req, 'CONFIRM', 'SalesOrder', result.id, `تأكيد أمر المبيعات ${orderNumber} وإطلاق دورة تصنيع MTO وحجز الخامات`);

    return res.status(201).json({ salesOrder: result });
  } catch (error: any) {
    console.error('Confirm sales order error:', error);
    return res.status(500).json({ error: error.message || 'فشل تأكيد أمر المبيعات' });
  }
});

export default router;
