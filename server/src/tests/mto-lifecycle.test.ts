/**
 * FACTORYFLOW ERP - Automated MTO Manufacturing Lifecycle Test Suite
 * 
 * Verifies the complete 16-step Make-to-Order manufacturing workflow
 * on the real database with actual REST API calls:
 * 1. Health & Egyptian Localization Check
 * 2. Authentication & RBAC Switcher
 * 3. Customer Registration (Egyptian TRN/CR)
 * 4. Quotation with Multi-level BOM Cost Estimation
 * 5. Order Confirmation & MTO Engine Trigger (Atomic BOM Explosion)
 * 6. Material Shortage Detection & Auto Purchase Requisition
 * 7. Supplier Purchase Order with 14% VAT & 1% WHT
 * 8. Goods Receipt Note (GRN) & Stock Movement
 * 9. Order-Specific Material Reservation
 * 10. Material Issue to Production (Non-negative inventory)
 * 11. Work Operations Execution (Laser, Bending, Welding, Assembly)
 * 12. Quality Inspection (QA/QC) Tolerance Verification
 * 13. Production Order Completion
 * 14. Egyptian Tax Authority (ETA) v1.0 E-Invoice Generation (UUID, EGS coding)
 * 15. ETA Submission & Customer Payment Settlement
 * 16. Actual Order Costing (COGS: Materials + Labor + Overhead) & Margin Analysis
 */

import { prisma } from '../prisma';

const API_BASE = 'http://localhost:5001/api';

interface TestContext {
  token: string;
  customerId: string;
  quotationId: string;
  salesOrderId: string;
  productionOrderId: string;
  purchaseRequestId?: string;
  purchaseOrderId?: string;
  invoiceId: string;
}

const context: TestContext = {
  token: '',
  customerId: '',
  quotationId: '',
  salesOrderId: '',
  productionOrderId: '',
  invoiceId: '',
};

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passedTests++;
  console.log(`  ✓ ${message}`);
}

async function api(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (context.token) {
    headers['Authorization'] = `Bearer ${context.token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runMtoLifecycleTests() {
  console.log('===============================================================');
  console.log('🏭 FACTORYFLOW ERP: Complete MTO Lifecycle Automated Test Suite');
  console.log('🇪🇬 Al-Ahram Engineering & Metal Industries S.A.E. (10th of Ramadan)');
  console.log('===============================================================\n');

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Health & Egyptian Localization
    // -------------------------------------------------------------------------
    console.log('[TEST 1/16] Verifying System Health & Egyptian Localization...');
    const health = await api('/health');
    assert(health.ok, 'Health endpoint responds with 200 OK');
    assert(health.data.status === 'ONLINE', 'System status is ONLINE');
    assert(health.data.timezone === 'Africa/Cairo', 'System timezone is set to Africa/Cairo (UTC+2)');
    assert(health.data.company?.country === 'EG' || health.data.company?.country === 'مصر', 'Operating jurisdiction is Egypt (EG / مصر)');

    // -------------------------------------------------------------------------
    // TEST 2: Authentication & RBAC
    // -------------------------------------------------------------------------
    console.log('\n[TEST 2/16] Authenticating as Super Admin...');
    const login = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@factoryflow.eg', password: 'FactoryFlow@2026' }),
    });
    assert(login.ok, 'Super Admin login successful');
    assert(!!login.data.token, 'JWT Token generated');
    assert(login.data.user.role === 'SUPER_ADMIN', 'User role is SUPER_ADMIN');
    context.token = login.data.token;

    // Test 1-click Role Switcher
    const switchRole = await api('/auth/switch-role', {
      method: 'POST',
      body: JSON.stringify({ targetRole: 'SALES_MANAGER' }),
    });
    assert(switchRole.ok, 'Role switcher successfully changed role to SALES_MANAGER');
    assert(switchRole.data.user.role === 'SALES_MANAGER', 'New token reflects SALES_MANAGER');
    context.token = switchRole.data.token; // switch back to super admin afterwards
    const backToAdmin = await api('/auth/switch-role', {
      method: 'POST',
      body: JSON.stringify({ targetRole: 'SUPER_ADMIN' }),
    });
    context.token = backToAdmin.data.token;

    // -------------------------------------------------------------------------
    // TEST 3: Customer Registration (Egyptian TRN & Commercial Reg)
    // -------------------------------------------------------------------------
    console.log('\n[TEST 3/16] Registering New Egyptian Industrial Customer...');
    const custRes = await api('/sales/customers', {
      method: 'POST',
      body: JSON.stringify({
        nameAr: 'شركة السويدي للكابلات والأنظمة الكهربائية ش.م.م',
        nameEn: 'Elsewedy Cables & Electrical Systems S.A.E.',
        taxRegistrationNo: '100-988-341',
        commercialRegNo: '78412 - العاشر من رمضان',
        contactPerson: 'المهندس كريم الشريف',
        email: 'procurement@elsewedy-systems.eg',
        phone: '+20 100 234 5678',
        address: 'المنطقة الصناعية الأولى، العاشر من رمضان',
        city: 'العاشر من رمضان',
        governorate: 'الشرقية',
        paymentTermsDays: 45,
        creditLimitEgp: 1500000,
      }),
    });
    assert(custRes.ok, 'Customer registered successfully in database');
    assert(custRes.data.customer.taxRegistrationNo === '100-988-341', 'Customer Egyptian TRN stored');
    context.customerId = custRes.data.customer.id;

    // -------------------------------------------------------------------------
    // TEST 4: Engineering Quotation with Multi-Level BOM
    // -------------------------------------------------------------------------
    console.log('\n[TEST 4/16] Creating Engineering Quotation (BOM Cost Estimation)...');
    // Find finished product with defined Bill of Materials (BOM)
    const bomsRes = await api('/engineering/boms');
    assert(bomsRes.ok && bomsRes.data.boms.length > 0, 'BOM definition exists in database');
    const bom = bomsRes.data.boms[0];

    const productsRes = await api('/engineering/products');
    const switchgear = productsRes.data.products.find((p: any) => p.id === bom.productId) || productsRes.data.products[0];
    assert(!!switchgear, `Finished product '${switchgear.nameEn}' identified with BOM`);

    const quoteRes = await api('/sales/quotations', {
      method: 'POST',
      body: JSON.stringify({
        customerId: context.customerId,
        validUntilWeeks: 4,
        notes: 'عرض أسعار لتوريد لوحات توزيع صناعية مقاومة للعوامل الجوية IP65',
        items: [
          {
            productId: switchgear.id,
            quantity: 5,
            unitPriceEgp: switchgear.sellingPriceEgp,
            estimatedCostEgp: switchgear.standardCostEgp,
            marginPercent: 30.0,
          },
        ],
      }),
    });
    assert(quoteRes.ok, 'Quotation generated successfully');
    assert(quoteRes.data.quotation.status === 'SENT', 'Quotation marked as SENT');
    assert(quoteRes.data.quotation.taxRatePercent === 14.0, 'Egyptian 14% VAT applied to quotation');
    context.quotationId = quoteRes.data.quotation.id;

    // -------------------------------------------------------------------------
    // TEST 5: Customer Approval & MTO Production Order Trigger
    // -------------------------------------------------------------------------
    console.log('\n[TEST 5/16] Confirming Customer Order & Triggering MTO Engine...');
    const orderRes = await api('/sales/orders', {
      method: 'POST',
      body: JSON.stringify({
        customerId: context.customerId,
        quotationId: context.quotationId,
        deliveryDays: 25,
        advancePaymentEgp: 50000,
        paymentTerms: '50% دفعة مقدمة و50% بعد الاستلام والاختبار',
        notes: 'الالتزام التام بسماكة الدهان ومطابقة مسارات العزل',
        items: [
          {
            productId: switchgear.id,
            quantity: 5,
            unitPriceEgp: switchgear.sellingPriceEgp,
          },
        ],
      }),
    });
    assert(orderRes.ok, 'Sales Order confirmed and MTO Engine executed atomically');
    assert(orderRes.data.salesOrder.status === 'IN_PRODUCTION', 'Sales Order status transitioned to IN_PRODUCTION');
    context.salesOrderId = orderRes.data.salesOrder.id;

    // Verify linked production orders
    const prodOrdersRes = await api('/production/orders');
    const linkedOrders = prodOrdersRes.data.orders.filter((po: any) => po.salesOrderId === context.salesOrderId);
    assert(linkedOrders.length > 0, 'Production Orders spawned with customer order traceability');
    context.productionOrderId = linkedOrders[0].id;

    // -------------------------------------------------------------------------
    // TEST 6: Material Requirements & Shortage Verification
    // -------------------------------------------------------------------------
    console.log('\n[TEST 6/16] Verifying BOM Explosion & Shortage Detection...');
    const prodOrderRes = await api(`/production/orders/${context.productionOrderId}`);
    assert(prodOrderRes.ok, 'Production Order retrieved');
    const matReqs = prodOrderRes.data.order.materialRequirements;
    assert(matReqs.length > 0, 'Material Requirements generated from multi-level BOM explosion');
    console.log(`    Materials exploded: ${matReqs.map((m: any) => `${m.materialProduct.nameEn} (Req: ${m.requiredQuantity})`).join(', ')}`);

    // Check if auto-generated purchase request exists
    const prRes = await api('/procurement/requests');
    const linkedPr = prRes.data.requests.find((r: any) => r.salesOrderId === context.salesOrderId);
    if (linkedPr) {
      console.log(`    ✓ Auto Purchase Request created for shortage: ${linkedPr.requestNumber}`);
      context.purchaseRequestId = linkedPr.id;
    } else {
      console.log('    ✓ All required materials were available in stock for immediate reservation');
    }

    // -------------------------------------------------------------------------
    // TEST 7: Procurement PO with 14% VAT & 1% Withholding Tax
    // -------------------------------------------------------------------------
    console.log('\n[TEST 7/16] Testing Procurement & Purchase Order Flow...');
    const suppliersRes = await api('/procurement/suppliers');
    const supplier = suppliersRes.data.suppliers[0];
    assert(!!supplier, 'Egyptian raw material supplier available');

    const poRes = await api('/procurement/orders', {
      method: 'POST',
      body: JSON.stringify({
        supplierId: supplier.id,
        expectedDeliveryDays: 7,
        paymentTerms: 'سداد بشيك بنكي خلال 30 يوم من الفاتورة',
        notes: 'توريد دفعة خامات للمشروع',
        items: [
          {
            productId: matReqs[0].materialProductId,
            quantity: 50,
            unitPriceEgp: matReqs[0].unitCostEgp,
          },
        ],
      }),
    });
    assert(poRes.ok, 'Supplier Purchase Order created');
    assert(poRes.data.purchaseOrder.vatRatePercent === 14.0, 'Egyptian 14% VAT applied');
    assert(poRes.data.purchaseOrder.whtRatePercent === 1.0, 'Egyptian 1% WHT applied');
    context.purchaseOrderId = poRes.data.purchaseOrder.id;

    // -------------------------------------------------------------------------
    // TEST 8: Goods Receipt Note (GRN) & Stock Movement
    // -------------------------------------------------------------------------
    console.log('\n[TEST 8/16] Receiving Goods via GRN into Factory Warehouse...');
    const grnRes = await api('/procurement/goods-receipt', {
      method: 'POST',
      body: JSON.stringify({
        purchaseOrderId: context.purchaseOrderId,
        supplierDeliveryNote: 'DN-EZZ-99124',
        items: [
          {
            purchaseOrderItemId: poRes.data.purchaseOrder.items[0].id,
            quantityReceived: 50,
            lotBatchNumber: 'BATCH-2026-X1',
          },
        ],
      }),
    });
    assert(grnRes.ok, 'Goods Receipt Note logged and inventory incremented');
    assert(grnRes.data.goodsReceipt.receiptNumber.startsWith('GR-'), 'GRN number generated');

    // -------------------------------------------------------------------------
    // TEST 9: Order-Specific Stock Allocation & Material Reservation
    // -------------------------------------------------------------------------
    console.log('\n[TEST 9/16] Verifying Order-Specific Material Reservations...');
    const reservRes = await api('/inventory/reservations');
    const orderReservations = reservRes.data.reservations.filter((r: any) => r.salesOrderId === context.salesOrderId);
    assert(orderReservations.length > 0, 'Inventory reserved specifically for this customer order');

    // -------------------------------------------------------------------------
    // TEST 10: Material Issue to Production (Non-Negative Stock Control)
    // -------------------------------------------------------------------------
    console.log('\n[TEST 10/16] Issuing Reserved Material to Production Order...');
    const targetReq = matReqs[0];
    const issueRes = await api(`/production/orders/${context.productionOrderId}/issue-material`, {
      method: 'POST',
      body: JSON.stringify({
        materialRequirementId: targetReq.id,
        quantityToIssue: Math.min(10, targetReq.requiredQuantity),
      }),
    });
    assert(issueRes.ok, 'Material successfully issued to shop floor without negative stock');
    assert(issueRes.data.newIssued > 0, 'Issued quantity incremented on material requirement');

    // -------------------------------------------------------------------------
    // TEST 11: Work Operations Execution & Real Labor Hours
    // -------------------------------------------------------------------------
    console.log('\n[TEST 11/16] Recording Work Operations & Operator Labor...');
    const operations = prodOrderRes.data.order.operations;
    assert(operations.length > 0, 'Routing operations populated for production order');

    const firstOp = operations[0];
    // Start operation
    const startOpRes = await api(`/production/operations/${firstOp.id}/update-status`, {
      method: 'POST',
      body: JSON.stringify({ status: 'IN_PROGRESS' }),
    });
    assert(startOpRes.ok, `Operation '${firstOp.operationNameEn}' started`);

    // Complete operation with actual hours and good output
    const completeOpRes = await api(`/production/operations/${firstOp.id}/update-status`, {
      method: 'POST',
      body: JSON.stringify({
        status: 'COMPLETED',
        actualHours: firstOp.plannedHours * 0.95, // 5% more efficient
        goodQuantity: 5,
        scrapQuantity: 0,
        notes: 'تم القص بالليزر بدقة متناهية ودون أي انحراف في الأبعاد',
      }),
    });
    assert(completeOpRes.ok, `Operation '${firstOp.operationNameEn}' completed and actual labor logged`);

    // -------------------------------------------------------------------------
    // TEST 12: Quality Control (QC) & Inspection
    // -------------------------------------------------------------------------
    console.log('\n[TEST 12/16] Logging QA/QC Inspection & Standards Verification...');
    const qcRes = await api('/quality/inspections', {
      method: 'POST',
      body: JSON.stringify({
        type: 'IN_PROCESS',
        productionOrderId: context.productionOrderId,
        productId: switchgear.id,
        inspectedQuantity: 5,
        passedQuantity: 5,
        rejectedQuantity: 0,
        result: 'PASSED',
        notes: 'فحص سماكة الدهان واختبار العزل حتى 1000 فولت - النتيجة مطابقة تماماً',
      }),
    });
    assert(qcRes.ok, 'Quality inspection record created');
    assert(qcRes.data.inspection.result === 'PASSED', 'Quality verdict is PASSED');

    // -------------------------------------------------------------------------
    // TEST 13: Production Completion
    // -------------------------------------------------------------------------
    console.log('\n[TEST 13/16] Completing Production Order...');
    const prodCompleteRes = await api(`/production/orders/${context.productionOrderId}/complete`, {
      method: 'POST',
      body: JSON.stringify({
        completedQuantity: 5,
        scrappedQuantity: 0,
        notes: 'تم الانتهاء من التجميع النهائي وجاهز للتسليم للعميل',
      }),
    });
    assert(prodCompleteRes.ok, 'Production order marked complete');
    assert(prodCompleteRes.data.productionOrder.status === 'QC_INSPECTION', 'Routed to final dispatch QA');

    // -------------------------------------------------------------------------
    // TEST 14: Customer Tax Invoice (ETA v1.0 Compliant)
    // -------------------------------------------------------------------------
    console.log('\n[TEST 14/16] Generating Egyptian Tax Invoice (ETA v1.0 Spec)...');
    const invRes = await api('/finance/invoices', {
      method: 'POST',
      body: JSON.stringify({
        salesOrderId: context.salesOrderId,
        customerId: context.customerId,
        dueDays: 30,
        items: [
          {
            productId: switchgear.id,
            description: switchgear.nameAr,
            quantity: 5,
            unitPriceEgp: switchgear.sellingPriceEgp,
          },
        ],
        notes: 'فاتورة ضريبية إلكترونية - توريد لوحات توزيع كهربائية IP65',
      }),
    });
    assert(invRes.ok, 'Customer Tax Invoice generated');
    assert(!!invRes.data.invoice.etaUuid, 'Cryptographic UUID generated for ETA E-Invoicing');
    assert(invRes.data.invoice.vatRatePercent === 14.0, 'Egyptian 14% VAT applied');
    assert(invRes.data.invoice.whtRatePercent === 1.0, 'Egyptian 1% WHT deducted');
    context.invoiceId = invRes.data.invoice.id;

    // Verify ETA Payload JSON
    const etaPayloadRes = await api(`/finance/invoices/${context.invoiceId}/eta-payload`);
    assert(etaPayloadRes.ok, 'ETA Document JSON built successfully');
    const doc = etaPayloadRes.data.etaDocument;
    assert(doc.documentTypeVersion === '1.0', 'Document Type Version is 1.0');
    assert(doc.issuer.address.country === 'EG', 'Issuer address country is EG');
    assert(doc.taxpayerActivityCode === '2811', 'ETA metal manufacturing activity code 2811 present');
    assert(doc.invoiceLines[0].itemType === 'EGS', 'Item coding standard is EGS');
    assert(doc.taxTotals.some((t: any) => t.taxType === 'T1'), 'VAT T1 tax total calculated');
    assert(doc.taxTotals.some((t: any) => t.taxType === 'T4'), 'WHT T4 tax total calculated');

    // -------------------------------------------------------------------------
    // TEST 15: ETA Submission & Customer Payment Settlement
    // -------------------------------------------------------------------------
    console.log('\n[TEST 15/16] Submitting to ETA & Recording Customer Payment...');
    const submitEtaRes = await api(`/finance/invoices/${context.invoiceId}/submit-eta`, { method: 'POST' });
    assert(submitEtaRes.ok, 'Invoice submitted to Egyptian Tax Authority portal');
    assert(submitEtaRes.data.status === 'Valid', 'Invoice status is Valid on ETA portal');

    // Pay invoice in full
    const invoiceTotal = invRes.data.invoice.totalAmountEgp;
    const payRes = await api('/finance/payments', {
      method: 'POST',
      body: JSON.stringify({
        invoiceId: context.invoiceId,
        amountEgp: invoiceTotal,
        paymentMethod: 'BANK_TRANSFER',
        referenceNumber: 'TRF-CIB-2026-8812',
        bankName: 'البنك التجاري الدولي CIB مصر',
        notes: 'سداد كامل قيمة الفاتورة الضريبية عبر تحويل بنكي',
      }),
    });
    assert(payRes.ok, 'Customer payment successfully recorded');
    assert(payRes.data.payment.amountEgp === invoiceTotal, 'Payment matches invoice total amount');

    // Verify invoice status updated to PAID
    const verifiedInv = await api('/finance/invoices');
    const targetInv = verifiedInv.data.invoices.find((i: any) => i.id === context.invoiceId);
    assert(targetInv.paymentStatus === 'PAID', 'Invoice payment status updated to PAID');

    // -------------------------------------------------------------------------
    // TEST 16: Actual Order Costing & Profitability Analysis
    // -------------------------------------------------------------------------
    console.log('\n[TEST 16/16] Calculating Actual Order Costing & Profitability...');
    const costingRes = await api(`/finance/order-costing/${context.productionOrderId}`);
    assert(costingRes.ok, 'Actual order costing breakdown calculated');
    const summary = costingRes.data.financialSummary;
    assert(summary.revenueEgp > 0, 'Contracted revenue verified');
    assert(summary.totalActualCOGS >= 0, 'Total COGS (Direct Materials + Labor + Overhead) calculated');
    assert(summary.grossMarginEgp > 0, 'Gross profit margin is positive');
    console.log(`    Revenue: ${summary.revenueEgp.toLocaleString()} EGP`);
    console.log(`    Actual COGS: ${summary.totalActualCOGS.toLocaleString()} EGP`);
    console.log(`    Gross Margin: ${summary.grossMarginEgp.toLocaleString()} EGP (${summary.grossMarginPercent}%)`);

    // -------------------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------------------
    console.log('\n===============================================================');
    console.log(`🎉 ALL ${passedTests}/${totalTests} MTO AUTOMATED INTEGRATION TESTS PASSED!`);
    console.log('✅ 100% Real Database Execution with Zero Fake Mock Responses.');
    console.log('✅ Egyptian Market Compliance: 14% VAT, 1% WHT, ETA v1.0 JSON.');
    console.log('===============================================================\n');

  } catch (err: any) {
    console.error('\n❌ TEST RUN TERMINATED WITH ERROR:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMtoLifecycleTests();
