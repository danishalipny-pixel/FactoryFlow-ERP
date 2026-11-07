import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting FactoryFlow ERP Egyptian Manufacturing Seed...');

  // Clean existing data in reverse dependency order
  await prisma.journalEntryLine.deleteMany();
  await prisma.journalEntry.deleteMany();
  await prisma.chartOfAccount.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.qualityDefect.deleteMany();
  await prisma.qualityInspection.deleteMany();
  await prisma.goodsReceiptItem.deleteMany();
  await prisma.goodsReceipt.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.purchaseRequestItem.deleteMany();
  await prisma.purchaseRequest.deleteMany();
  await prisma.materialReservation.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.materialRequirement.deleteMany();
  await prisma.productionOperation.deleteMany();
  await prisma.productionOrder.deleteMany();
  await prisma.routingOperation.deleteMany();
  await prisma.routing.deleteMany();
  await prisma.bOMItem.deleteMany();
  await prisma.bOM.deleteMany();
  await prisma.salesOrderItem.deleteMany();
  await prisma.salesOrder.deleteMany();
  await prisma.quotationItem.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.product.deleteMany();
  await prisma.workCenter.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.department.deleteMany();
  await prisma.factory.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  // 1. Company: Al-Ahram Engineering & Metal Industries
  const company = await prisma.company.create({
    data: {
      nameAr: 'شركة الأهرام للصناعات الهندسية والمعدنية ش.م.م',
      nameEn: 'Al-Ahram Engineering & Metal Industries S.A.E.',
      commercialRegNo: '45892 - جنوب الجيزة',
      taxRegistrationNo: '100-245-892',
      vatRegistrationNo: '302-841-776',
      etaIssuerId: 'ETA-EG-100245892',
      address: 'المنطقة الصناعية الثالثة B4، العاشر من رمضان',
      city: 'مدينة العاشر من رمضان',
      country: 'مصر',
      phone: '+20 15 389400 / +20 100 123 4567',
      email: 'info@alahram-metal.eg',
      currency: 'EGP',
      defaultVatRate: 14.0,
      defaultWhtRate: 1.0,
    },
  });

  // 2. Factory
  const factory = await prisma.factory.create({
    data: {
      companyId: company.id,
      code: 'FAC-RAMADAN-01',
      nameAr: 'مجمع مصانع العاشر من رمضان للتشغيل والتشكيل الهندسي',
      nameEn: '10th of Ramadan Metal Fabrication Complex',
      location: 'المنطقة الصناعية الثالثة، العاشر من رمضان، محافظة الشرقية',
    },
  });

  // 3. Departments
  const deptEng = await prisma.department.create({
    data: {
      companyId: company.id,
      code: 'ENG',
      nameAr: 'إدارة الهندسة والتصميم وتطوير المنتجات',
      nameEn: 'Engineering & Product Design Dept',
    },
  });
  const deptProd = await prisma.department.create({
    data: {
      companyId: company.id,
      code: 'PROD',
      nameAr: 'إدارة الإنتاج والتصنيع',
      nameEn: 'Production & Manufacturing Dept',
    },
  });
  const deptQC = await prisma.department.create({
    data: {
      companyId: company.id,
      code: 'QC',
      nameAr: 'إدارة توكيد ومراقبة الجودة',
      nameEn: 'Quality Assurance & Control Dept',
    },
  });
  const deptSCM = await prisma.department.create({
    data: {
      companyId: company.id,
      code: 'SCM',
      nameAr: 'إدارة المشتريات وسلاسل الإمداد والمخازن',
      nameEn: 'Supply Chain, Procurement & Stores',
    },
  });
  const deptFinance = await prisma.department.create({
    data: {
      companyId: company.id,
      code: 'FIN',
      nameAr: 'الإدارة المالية وحسابات التكاليف',
      nameEn: 'Finance & Cost Accounting Dept',
    },
  });
  const deptHR = await prisma.department.create({
    data: {
      companyId: company.id,
      code: 'HR',
      nameAr: 'إدارة الموارد البشرية والشؤون الإدارية',
      nameEn: 'Human Resources & Administration',
    },
  });

  // 4. Employees
  const empManager = await prisma.employee.create({
    data: {
      code: 'EMP-0101',
      nationalId: '28501140102345',
      firstNameAr: 'أحمد',
      lastNameAr: 'منصور',
      firstNameEn: 'Ahmed',
      lastNameEn: 'Mansour',
      jobTitleAr: 'مدير العمليات والإنتاج',
      jobTitleEn: 'Production & Operations Manager',
      departmentId: deptProd.id,
      shift: 'MORNING',
      hourlyRateEgp: 180.0,
      phone: '+20 100 555 1201',
      status: 'ACTIVE',
    },
  });

  const empQC = await prisma.employee.create({
    data: {
      code: 'EMP-0102',
      nationalId: '28906200109876',
      firstNameAr: 'تامر',
      lastNameAr: 'رضوان',
      firstNameEn: 'Tamer',
      lastNameEn: 'Radwan',
      jobTitleAr: 'رئيس قسم توكيد الجودة والتفتيش',
      jobTitleEn: 'Quality Assurance Lead',
      departmentId: deptQC.id,
      shift: 'MORNING',
      hourlyRateEgp: 140.0,
      phone: '+20 101 222 3402',
      status: 'ACTIVE',
    },
  });

  const empLaserOp = await prisma.employee.create({
    data: {
      code: 'EMP-0205',
      nationalId: '29208151401234',
      firstNameAr: 'محمد',
      lastNameAr: 'السيد عبد القادر',
      firstNameEn: 'Mohamed',
      lastNameEn: 'El-Sayed',
      jobTitleAr: 'فني أول تشغيل ماكينات قص ليزر CNC',
      jobTitleEn: 'Senior CNC Laser Operator',
      departmentId: deptProd.id,
      shift: 'MORNING',
      hourlyRateEgp: 75.0,
      phone: '+20 112 345 6789',
      status: 'ACTIVE',
    },
  });

  const empWelder = await prisma.employee.create({
    data: {
      code: 'EMP-0208',
      nationalId: '29004122108765',
      firstNameAr: 'محمود',
      lastNameAr: 'حسن إبراهيم',
      firstNameEn: 'Mahmoud',
      lastNameEn: 'Hassan',
      jobTitleAr: 'فني لحام أرجون معتمد 6G',
      jobTitleEn: 'Certified TIG/MIG Welder',
      departmentId: deptProd.id,
      shift: 'MORNING',
      hourlyRateEgp: 85.0,
      phone: '+20 122 888 9911',
      status: 'ACTIVE',
    },
  });

  const empAssembler = await prisma.employee.create({
    data: {
      code: 'EMP-0210',
      nationalId: '29507190103322',
      firstNameAr: 'مصطفى',
      lastNameAr: 'كامل الشناوي',
      firstNameEn: 'Mostafa',
      lastNameEn: 'Kamel',
      jobTitleAr: 'فني تجميع ميكانيكي وضفائر',
      jobTitleEn: 'Assembly & Wiring Technician',
      departmentId: deptProd.id,
      shift: 'MORNING',
      hourlyRateEgp: 65.0,
      phone: '+20 109 444 7722',
      status: 'ACTIVE',
    },
  });

  // 5. Users (All 11 Enterprise Roles)
  const passwordHash = await bcrypt.hash('FactoryFlow@2026', 10);
  
  const usersData = [
    { email: 'admin@factoryflow.eg', role: 'SUPER_ADMIN', ar: 'المهندس كريم نبيل - مدير النظام', en: 'Karim Nabil (Super Admin)' },
    { email: 'owner@alahram-metal.eg', role: 'FACTORY_OWNER', ar: 'الحاج مجدي الأهرامي - رئيس مجلس الإدارة', en: 'Magdy El-Ahramy (Factory Owner)' },
    { email: 'gm@alahram-metal.eg', role: 'GENERAL_MANAGER', ar: 'د. عادل فوزي - المدير العام', en: 'Dr. Adel Fawzy (General Manager)' },
    { email: 'sales@alahram-metal.eg', role: 'SALES_MANAGER', ar: 'أ. شريف يوسف - مدير المبيعات والتعاقدات', en: 'Sherif Youssef (Sales Manager)' },
    { email: 'production@alahram-metal.eg', role: 'PRODUCTION_MANAGER', ar: 'م. أحمد منصور - مدير الإنتاج والعمليات', en: 'Eng. Ahmed Mansour (Production Manager)' },
    { email: 'procurement@alahram-metal.eg', role: 'PROCUREMENT_MANAGER', ar: 'أ. طارق عبد الوهاب - مدير المشتريات', en: 'Tarek Abdelwahab (Procurement Manager)' },
    { email: 'warehouse@alahram-metal.eg', role: 'WAREHOUSE_MANAGER', ar: 'أ. حسام فاروق - مدير المخازن واللوجستيات', en: 'Hossam Farouk (Warehouse Manager)' },
    { email: 'finance@alahram-metal.eg', role: 'ACCOUNTANT', ar: 'أ. سمر عبد العزيز - رئيسة حسابات التكاليف', en: 'Samar Abdelaziz (Chief Accountant)' },
    { email: 'hr@alahram-metal.eg', role: 'HR_MANAGER', ar: 'أ. هالة الجندي - مديرة الموارد البشرية', en: 'Hala El-Gendy (HR Manager)' },
    { email: 'qc@alahram-metal.eg', role: 'QUALITY_INSPECTOR', ar: 'م. تامر رضوان - مهندس الجودة والتفتيش', en: 'Eng. Tamer Radwan (QC Inspector)' },
    { email: 'operator@alahram-metal.eg', role: 'PRODUCTION_OPERATOR', ar: 'محمد السيد - مشغل ماكينات CNC', en: 'Mohamed El-Sayed (Operator)' },
  ];

  for (const u of usersData) {
    await prisma.user.create({
      data: {
        companyId: company.id,
        email: u.email,
        passwordHash,
        fullNameAr: u.ar,
        fullNameEn: u.en,
        role: u.role,
        isActive: true,
        languagePreference: 'ar',
      },
    });
  }

  // 6. Warehouses
  const whRaw = await prisma.warehouse.create({
    data: {
      factoryId: factory.id,
      code: 'WH-RAW-01',
      nameAr: 'مخزن الصاج والمعادن والقطاعات الثقيلة',
      nameEn: 'Raw Metals & Structural Steel Warehouse',
      location: 'عنبر 1 - بوابة الشاحنات الشرقية',
    },
  });
  const whConsumables = await prisma.warehouse.create({
    data: {
      factoryId: factory.id,
      code: 'WH-CONS-02',
      nameAr: 'مخزن المستلزمات والكيماويات ومسحوق الدهان',
      nameEn: 'Consumables, Hardware & Powder Coating Store',
      location: 'عنبر 2 - بجوار خط الدهان',
    },
  });
  const whWip = await prisma.warehouse.create({
    data: {
      factoryId: factory.id,
      code: 'WH-WIP-03',
      nameAr: 'منطقة المنتجات نصف المصنعة تحت التشغيل',
      nameEn: 'Work-In-Progress (WIP) Staging Area',
      location: 'الساحة المركزية بين خطوط التشكيل والتجميع',
    },
  });
  const whFinished = await prisma.warehouse.create({
    data: {
      factoryId: factory.id,
      code: 'WH-FIN-04',
      nameAr: 'مستودع الشحن وتسليم طلبات العملاء المخصصة',
      nameEn: 'Finished Goods & Client Dispatch Warehouse',
      location: 'عنبر 4 - رصيف الشحن والتسليم الخارجي',
    },
  });

  // 7. Work Centers
  const wcLaser = await prisma.workCenter.create({
    data: {
      factoryId: factory.id,
      departmentId: deptProd.id,
      code: 'WC-LASER-01',
      nameAr: 'ماكينة قص بالليزر فايبر 6 كيلووات CNC Fiber Laser',
      nameEn: 'CNC Fiber Laser Cutting Machine 6kW',
      capacityHoursPerDay: 16.0,
      hourlyCostRateEgp: 350.0,
      efficiencyPercent: 92.0,
      status: 'OPERATIONAL',
    },
  });
  const wcBending = await prisma.workCenter.create({
    data: {
      factoryId: factory.id,
      departmentId: deptProd.id,
      code: 'WC-BEND-01',
      nameAr: 'ثناية هيدروليكية رقمية 320 طن CNC Press Brake',
      nameEn: 'CNC Hydraulic Press Brake 320 Ton',
      capacityHoursPerDay: 16.0,
      hourlyCostRateEgp: 220.0,
      efficiencyPercent: 88.0,
      status: 'OPERATIONAL',
    },
  });
  const wcWelding = await prisma.workCenter.create({
    data: {
      factoryId: factory.id,
      departmentId: deptProd.id,
      code: 'WC-WELD-01',
      nameAr: 'محطة لحام أرجون TIG ولحام ميج نصف آلي',
      nameEn: 'TIG/MIG Manual & Semi-Auto Welding Bay',
      capacityHoursPerDay: 16.0,
      hourlyCostRateEgp: 180.0,
      efficiencyPercent: 90.0,
      status: 'OPERATIONAL',
    },
  });
  const wcPowder = await prisma.workCenter.create({
    data: {
      factoryId: factory.id,
      departmentId: deptProd.id,
      code: 'WC-COAT-01',
      nameAr: 'نفق المعالجة الكيميائية وخط دهان كهروساكن وأفران',
      nameEn: 'Chemical Pretreatment & Electrostatic Powder Coating Line',
      capacityHoursPerDay: 16.0,
      hourlyCostRateEgp: 420.0,
      efficiencyPercent: 94.0,
      status: 'OPERATIONAL',
    },
  });
  const wcAssembly = await prisma.workCenter.create({
    data: {
      factoryId: factory.id,
      departmentId: deptProd.id,
      code: 'WC-ASSY-01',
      nameAr: 'ورشة التجميع الميكانيكي والتركيبات الكهربائية',
      nameEn: 'Mechanical Assembly & Electrical Integration Bay',
      capacityHoursPerDay: 16.0,
      hourlyCostRateEgp: 160.0,
      efficiencyPercent: 95.0,
      status: 'OPERATIONAL',
    },
  });
  const wcTesting = await prisma.workCenter.create({
    data: {
      factoryId: factory.id,
      departmentId: deptQC.id,
      code: 'WC-TEST-01',
      nameAr: 'محطة اختبارات الجودة والعزل وضغط الهيدروستاتيك',
      nameEn: 'QC Testing, Insulation & Hydrostatic Testing Lab',
      capacityHoursPerDay: 8.0,
      hourlyCostRateEgp: 250.0,
      efficiencyPercent: 96.0,
      status: 'OPERATIONAL',
    },
  });

  // 8. Raw Materials (Products)
  const matSteelSheet = await prisma.product.create({
    data: {
      itemCode: 'RM-STL-2MM',
      nameAr: 'صاج مسحوب على البارد عالي المتانة 2 مم',
      nameEn: 'Cold Rolled Steel Sheet 2.0mm Grade St-12',
      category: 'RAW_MATERIAL',
      unit: 'KG',
      standardCostEgp: 52.0,
      safetyStock: 3000.0,
    },
  });
  const matSSPlate = await prisma.product.create({
    data: {
      itemCode: 'RM-SS-316L',
      nameAr: 'ألواح ستانلس ستيل 316L غذائي سمك 3 مم',
      nameEn: 'Stainless Steel 316L Plate 3.0mm',
      category: 'RAW_MATERIAL',
      unit: 'KG',
      standardCostEgp: 245.0,
      safetyStock: 1200.0,
    },
  });
  const matCopperBusbar = await prisma.product.create({
    data: {
      itemCode: 'RM-COP-40X5',
      nameAr: 'قضبان نحاس أحمر نقي معزول 40×5 مم',
      nameEn: 'Electrolytic Copper Busbar 40x5mm',
      category: 'RAW_MATERIAL',
      unit: 'METER',
      standardCostEgp: 380.0,
      safetyStock: 150.0,
    },
  });
  const matPowderRAL = await prisma.product.create({
    data: {
      itemCode: 'RM-POW-7035',
      nameAr: 'مسحوق دهان كهروساكن بوليستر RAL 7035 ناعم',
      nameEn: 'Electrostatic Polyester Powder Coating RAL 7035',
      category: 'RAW_MATERIAL',
      unit: 'KG',
      standardCostEgp: 190.0,
      safetyStock: 400.0,
    },
  });
  const matBoltsM10 = await prisma.product.create({
    data: {
      itemCode: 'RM-BLT-M10',
      nameAr: 'مسامير صلب مجلفن عالي الصلابة M10×35 مع صواميل',
      nameEn: 'High-Tensile Galvanized Hex Bolts & Nuts M10x35',
      category: 'RAW_MATERIAL',
      unit: 'PIECE',
      standardCostEgp: 8.5,
      safetyStock: 5000.0,
    },
  });
  const matEPDMGasket = await prisma.product.create({
    data: {
      itemCode: 'RM-GSK-EPDM',
      nameAr: 'شريط جوان جوان مطاطي عازل للأتربة والرطوبة IP65',
      nameEn: 'EPDM Sealing Gasket Strip IP65 Protection',
      category: 'RAW_MATERIAL',
      unit: 'METER',
      standardCostEgp: 28.0,
      safetyStock: 600.0,
    },
  });

  // Finished Products (MTO Custom Assemblies)
  const prdSwitchgear = await prisma.product.create({
    data: {
      itemCode: 'MTO-SWG-400A',
      nameAr: 'لوحة توزيع كهربائية صناعية جهد منخفض 400 أمبير IP55 مخصصة',
      nameEn: 'Custom Industrial Low Voltage Switchgear Panel 400A IP55',
      category: 'FINISHED_PRODUCT',
      unit: 'PIECE',
      standardCostEgp: 28500.0,
      sellingPriceEgp: 42000.0,
      drawingNumber: 'DWG-EGY-2026-0044',
      revision: 'Rev.03',
    },
  });

  const prdVessel = await prisma.product.create({
    data: {
      itemCode: 'MTO-VESSEL-5M3',
      nameAr: 'خزان ضغط ستانلس ستيل 316L سعة 5 متر مكعب مع خلاط',
      nameEn: 'Stainless Steel 316L Pressure Vessel 5m³ with Agitator',
      category: 'FINISHED_PRODUCT',
      unit: 'PIECE',
      standardCostEgp: 195000.0,
      sellingPriceEgp: 275000.0,
      drawingNumber: 'DWG-VES-2026-0091',
      revision: 'Rev.02',
    },
  });

  const prdConveyor = await prisma.product.create({
    data: {
      itemCode: 'MTO-CONV-15M',
      nameAr: 'خط سير ناقل صناعي ثقيل معدني بطول 15 متر مع محرك سيمنز',
      nameEn: 'Heavy Industrial Belt Conveyor 15m with Siemens Motor',
      category: 'FINISHED_PRODUCT',
      unit: 'PIECE',
      standardCostEgp: 110000.0,
      sellingPriceEgp: 165000.0,
      drawingNumber: 'DWG-CNV-2026-0120',
      revision: 'Rev.01',
    },
  });

  // 9. BOM for MTO Switchgear 400A
  const bomSwitchgear = await prisma.bOM.create({
    data: {
      productId: prdSwitchgear.id,
      version: '1.2',
      nameAr: 'شجرة تصنيع لوحة التوزيع 400 أمبير IP55',
      nameEn: 'BOM - Industrial Switchgear Panel 400A IP55',
      yieldPercent: 98.5,
      estimatedMaterialCost: 19450.0,
      items: {
        create: [
          { componentId: matSteelSheet.id, quantity: 180.0, unit: 'KG', scrapPercentage: 4.0, notes: 'لهيكل وجسم اللوحة والأبواب' },
          { componentId: matCopperBusbar.id, quantity: 16.0, unit: 'METER', scrapPercentage: 2.0, notes: 'لبارات النحاس وتوزيع الفازات' },
          { componentId: matPowderRAL.id, quantity: 12.0, unit: 'KG', scrapPercentage: 6.0, notes: 'دهان الكتروستاتيك مقاوم للعوامل الجوية' },
          { componentId: matBoltsM10.id, quantity: 84.0, unit: 'PIECE', scrapPercentage: 1.0, notes: 'تجميع الشاسيه والبارات' },
          { componentId: matEPDMGasket.id, quantity: 18.0, unit: 'METER', scrapPercentage: 3.0, notes: 'عزل الباب الخارجي IP55' },
        ],
      },
    },
  });

  // Routing for MTO Switchgear
  const routingSwitchgear = await prisma.routing.create({
    data: {
      productId: prdSwitchgear.id,
      nameAr: 'مسار تشغيل وتصنيع لوحات التوزيع 400A',
      nameEn: 'Manufacturing Routing - Switchgear 400A',
      operations: {
        create: [
          { sequenceOrder: 10, nameAr: 'قص الألواح بالليزر حسب الرسم', nameEn: 'Laser Cutting of Enclosure Sheets', workCenterId: wcLaser.id, setupTimeMinutes: 45, runTimeMinutesPerUnit: 60, laborCountRequired: 1 },
          { sequenceOrder: 20, nameAr: 'ثني وتشكيل زوايا الهيكل', nameEn: 'CNC Press Brake Bending', workCenterId: wcBending.id, setupTimeMinutes: 30, runTimeMinutesPerUnit: 50, laborCountRequired: 1 },
          { sequenceOrder: 30, nameAr: 'لحام الشاسيه وتقويات الهيكل', nameEn: 'TIG/MIG Structure Welding', workCenterId: wcWelding.id, setupTimeMinutes: 20, runTimeMinutesPerUnit: 90, laborCountRequired: 2 },
          { sequenceOrder: 40, nameAr: 'المعالجة الكيميائية والدهان الحراري', nameEn: 'Pretreatment & Powder Coating', workCenterId: wcPowder.id, setupTimeMinutes: 60, runTimeMinutesPerUnit: 45, laborCountRequired: 2 },
          { sequenceOrder: 50, nameAr: 'تركيب بارات النحاس والعزل والتجميع', nameEn: 'Busbar Installation & Assembly', workCenterId: wcAssembly.id, setupTimeMinutes: 30, runTimeMinutesPerUnit: 180, laborCountRequired: 2 },
          { sequenceOrder: 60, nameAr: 'فحص العزل الكهربائي واختبار IP55', nameEn: 'Electrical Insulation & IP QC Test', workCenterId: wcTesting.id, setupTimeMinutes: 15, runTimeMinutesPerUnit: 40, laborCountRequired: 1 },
        ],
      },
    },
  });

  // 10. Initial Inventory Stock for Raw Materials
  await prisma.inventory.createMany({
    data: [
      { warehouseId: whRaw.id, productId: matSteelSheet.id, quantityOnHand: 8500.0, quantityReserved: 1800.0, quantityAvailable: 6700.0, averageUnitCostEgp: 52.0, locationBin: 'BAY-A1' },
      { warehouseId: whRaw.id, productId: matSSPlate.id, quantityOnHand: 4200.0, quantityReserved: 1500.0, quantityAvailable: 2700.0, averageUnitCostEgp: 245.0, locationBin: 'BAY-A3' },
      { warehouseId: whRaw.id, productId: matCopperBusbar.id, quantityOnHand: 180.0, quantityReserved: 160.0, quantityAvailable: 20.0, averageUnitCostEgp: 380.0, locationBin: 'RACK-C2' }, // Low available!
      { warehouseId: whConsumables.id, productId: matPowderRAL.id, quantityOnHand: 950.0, quantityReserved: 120.0, quantityAvailable: 830.0, averageUnitCostEgp: 190.0, locationBin: 'CHEM-B1' },
      { warehouseId: whConsumables.id, productId: matBoltsM10.id, quantityOnHand: 12000.0, quantityReserved: 840.0, quantityAvailable: 11160.0, averageUnitCostEgp: 8.5, locationBin: 'BIN-D4' },
      { warehouseId: whConsumables.id, productId: matEPDMGasket.id, quantityOnHand: 35.0, quantityReserved: 30.0, quantityAvailable: 5.0, averageUnitCostEgp: 28.0, locationBin: 'BIN-E2' }, // Shortage trigger!
    ],
  });

  // 11. Egyptian Customers
  const custSewedy = await prisma.customer.create({
    data: {
      code: 'CUST-EGY-001',
      nameAr: 'شركة السويدي إلكتريك للمشروعات ونقل الطاقة ش.م.م',
      nameEn: 'Elsewedy Electric Power Transmission S.A.E.',
      taxRegistrationNo: '200-112-990',
      commercialRegNo: '78231 - استثمار القاهرة',
      contactPerson: 'المهندس مصطفى الباز - مدير المشتريات والمشروعات',
      email: 'm.elbaz@elsewedy.com',
      phone: '+20 2 2759 9700',
      address: 'التجمع الخامس، القاهرة الجديدة، مبنى السويدي سنتر',
      city: 'القاهرة الجديدة',
      governorate: 'القاهرة',
      paymentTermsDays: 45,
      creditLimitEgp: 3000000.0,
    },
  });

  const custEdita = await prisma.customer.create({
    data: {
      code: 'CUST-EGY-002',
      nameAr: 'شركة إيديتا للصناعات الغذائية ش.م.م',
      nameEn: 'Edita Food Industries S.A.E.',
      taxRegistrationNo: '104-556-332',
      commercialRegNo: '48910 - السادس من أكتوبر',
      contactPerson: 'المهندس حازم الدالي - مدير الصيانة والمشاريع',
      email: 'hazem.eldaly@edita.com.eg',
      phone: '+20 2 3833 8740',
      address: 'المنطقة الصناعية الرابعة، السادس من أكتوبر',
      city: 'السادس من أكتوبر',
      governorate: 'الجيزة',
      paymentTermsDays: 30,
      creditLimitEgp: 1500000.0,
    },
  });

  const custJuhayna = await prisma.customer.create({
    data: {
      code: 'CUST-EGY-003',
      nameAr: 'شركة جهينة للصناعات الغذائية ش.م.م',
      nameEn: 'Juhayna Food Industries S.A.E.',
      taxRegistrationNo: '101-778-445',
      commercialRegNo: '33104 - الجيزة',
      contactPerson: 'م. أشرف عبد السلام - مدير الهندسة والمصانع',
      email: 'a.abdelsalam@juhayna.com',
      phone: '+20 2 3837 0100',
      address: 'مدينة 6 أكتوبر، مجمع مصانع الألبان والعصائر',
      city: 'السادس من أكتوبر',
      governorate: 'الجيزة',
      paymentTermsDays: 30,
      creditLimitEgp: 2000000.0,
    },
  });

  // 12. Egyptian Suppliers
  const suppEzz = await prisma.supplier.create({
    data: {
      code: 'SUP-EGY-001',
      nameAr: 'شركة حديد عز للصناعات المعدنية والتطفيح ش.م.م',
      nameEn: 'Ezz Steel & Flat Products S.A.E.',
      taxRegistrationNo: '202-881-304',
      commercialRegNo: '11092 - السويس',
      contactPerson: 'أ. سامح شكري - رئيس المبيعات الصناعية',
      email: 'industrial.sales@ezzsteel.com',
      phone: '+20 2 3304 6000',
      address: 'أبراج النايل سيتي، برج الشمال، كورنيش النيل، القاهرة',
      category: 'METALS',
      paymentTermsDays: 30,
      rating: 4.8,
    },
  });

  const suppPachin = await prisma.supplier.create({
    data: {
      code: 'SUP-EGY-002',
      nameAr: 'شركة البويات والصناعات الكيماوية (باكين) ش.م.م',
      nameEn: 'Paints and Chemical Industries (PACHIN) S.A.E.',
      taxRegistrationNo: '100-330-911',
      commercialRegNo: '22941 - القليوبية',
      contactPerson: 'ك. أشرف فؤاد - قطاع الدهانات الصناعية والبودرة',
      email: 'sales@pachin.eg',
      phone: '+20 2 4444 8810',
      address: 'العبور، المنطقة الصناعية، بلوك 13005',
      category: 'CHEMICALS',
      paymentTermsDays: 30,
      rating: 4.6,
    },
  });

  // 13. Quotation (Active Quote)
  const quote1 = await prisma.quotation.create({
    data: {
      quoteNumber: 'QUO-2026-0048',
      customerId: custJuhayna.id,
      issueDate: new Date('2026-10-25'),
      validUntil: new Date('2026-11-25'),
      status: 'SENT',
      subtotalEgp: 550000.0,
      taxRatePercent: 14.0,
      taxAmountEgp: 77000.0,
      totalAmountEgp: 627000.0,
      estimatedDeliveryWeeks: 4,
      notes: 'عرض أسعار لتصنيع 2 خزان ستانلس ستيل 5م3 مع خلاطات طبقا لمعايير الأغذية EHEDG',
      items: {
        create: [
          {
            productId: prdVessel.id,
            quantity: 2.0,
            unitPriceEgp: 275000.0,
            estimatedCostEgp: 195000.0,
            marginPercent: 29.09,
            totalPriceEgp: 550000.0,
            notes: 'ستانلس 316L مصقول سطح مرآة مع شفة تعقيم',
          },
        ],
      },
    },
  });

  // 14. Confirmed Sales Order 1: Elsewedy (Triggering MTO Production)
  const so1 = await prisma.salesOrder.create({
    data: {
      orderNumber: 'SO-2026-0012',
      customerId: custSewedy.id,
      orderDate: new Date('2026-10-15'),
      deliveryDeadline: new Date('2026-11-15'), // Upcoming deadline
      status: 'IN_PRODUCTION',
      subtotalEgp: 420000.0, // 10 units x 42,000 EGP
      taxRatePercent: 14.0,
      taxAmountEgp: 58800.0,
      whtRatePercent: 1.0,
      whtAmountEgp: 4200.0,
      totalAmountEgp: 474600.0,
      advancePaymentEgp: 200000.0,
      paymentTerms: '50% دفعة مقدمة والباقي بعد الاستلام والفحص بـ 30 يوماً',
      notes: 'مشروع محطة محولات غرب قنا - توريد لوحات توزيع صناعية 400A معزولة',
      items: {
        create: [
          {
            productId: prdSwitchgear.id,
            quantity: 10.0,
            unitPriceEgp: 42000.0,
            totalPriceEgp: 420000.0,
            deliveryDate: new Date('2026-11-15'),
            customSpecs: 'لوحات مدهونة RAL 7035 مع أبواب مزدوجة ونظام قفل تريموت وسدادات EPDM',
          },
        ],
      },
    },
  });

  const soItem1 = await prisma.salesOrderItem.findFirst({
    where: { salesOrderId: so1.id },
  });

  // 15. MTO Production Order 1: Directly Traceable to SO-2026-0012!
  const prodOrder1 = await prisma.productionOrder.create({
    data: {
      orderNumber: 'PO-MTO-2026-0012',
      salesOrderId: so1.id,
      salesOrderItemId: soItem1!.id,
      factoryId: factory.id,
      productId: prdSwitchgear.id,
      plannedQuantity: 10.0,
      completedQuantity: 6.0,
      scrappedQuantity: 0.0,
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      plannedStartDate: new Date('2026-10-18'),
      plannedDueDate: new Date('2026-11-12'),
      actualStartDate: new Date('2026-10-19'),
      plannedMaterialCostEgp: 194500.0, // 10 units x 19,450
      actualMaterialCostEgp: 196200.0,
      plannedLaborCostEgp: 48000.0,
      actualLaborCostEgp: 31200.0,
      plannedOverheadCostEgp: 42500.0,
      actualOverheadCostEgp: 28900.0,
      totalActualCostEgp: 256300.0,
      notes: 'تم الانتهاء من تصنيع 6 وحدات وجاري العمل على تجميع 4 وحدات الباقية',
    },
  });

  // Production Operations / Job Cards for PO-MTO-2026-0012
  const opLaser = await prisma.productionOperation.create({
    data: {
      productionOrderId: prodOrder1.id,
      sequenceOrder: 10,
      operationNameAr: 'قص الألواح بالليزر حسب الرسم',
      operationNameEn: 'Laser Cutting of Enclosure Sheets',
      workCenterId: wcLaser.id,
      assignedEmployeeId: empLaserOp.id,
      status: 'COMPLETED',
      plannedHours: 10.0,
      actualHours: 9.5,
      goodQuantity: 10.0,
      scrapQuantity: 0.0,
      startTime: new Date('2026-10-19T08:00:00'),
      endTime: new Date('2026-10-20T17:30:00'),
      notes: 'تم قص كافة أجزاء 10 لوحات بالكامل بجودة فائقة ونقاء حواف عالي',
    },
  });

  const opBending = await prisma.productionOperation.create({
    data: {
      productionOrderId: prodOrder1.id,
      sequenceOrder: 20,
      operationNameAr: 'ثني وتشكيل زوايا الهيكل والأبواب',
      operationNameEn: 'CNC Press Brake Bending',
      workCenterId: wcBending.id,
      assignedEmployeeId: empLaserOp.id,
      status: 'COMPLETED',
      plannedHours: 8.5,
      actualHours: 8.0,
      goodQuantity: 10.0,
      scrapQuantity: 0.0,
      startTime: new Date('2026-10-21T08:00:00'),
      endTime: new Date('2026-10-21T16:00:00'),
      notes: 'تمت مراجعة الزوايا بدقة 90 درجة وتطابق تام مع الأبعاد',
    },
  });

  const opWelding = await prisma.productionOperation.create({
    data: {
      productionOrderId: prodOrder1.id,
      sequenceOrder: 30,
      operationNameAr: 'لحام الشاسيه وتقويات الهيكل الداخلي',
      operationNameEn: 'TIG/MIG Structure Welding',
      workCenterId: wcWelding.id,
      assignedEmployeeId: empWelder.id,
      status: 'COMPLETED',
      plannedHours: 15.0,
      actualHours: 16.0,
      goodQuantity: 10.0,
      scrapQuantity: 0.0,
      startTime: new Date('2026-10-22T08:00:00'),
      endTime: new Date('2026-10-24T12:00:00'),
      notes: 'تم اللحام بدون أي عيوب أو تشوهات حرارية',
    },
  });

  const opCoating = await prisma.productionOperation.create({
    data: {
      productionOrderId: prodOrder1.id,
      sequenceOrder: 40,
      operationNameAr: 'المعالجة الكيميائية والدهان الحراري RAL 7035',
      operationNameEn: 'Pretreatment & Powder Coating',
      workCenterId: wcPowder.id,
      assignedEmployeeId: empWelder.id,
      status: 'COMPLETED',
      plannedHours: 7.5,
      actualHours: 7.0,
      goodQuantity: 10.0,
      scrapQuantity: 0.0,
      startTime: new Date('2026-10-25T08:00:00'),
      endTime: new Date('2026-10-25T15:00:00'),
      notes: 'سماكة طبقة الدهان 80 ميكرون متطابقة مع المواصفات',
    },
  });

  const opAssembly = await prisma.productionOperation.create({
    data: {
      productionOrderId: prodOrder1.id,
      sequenceOrder: 50,
      operationNameAr: 'تركيب بارات النحاس والعزل والتجميع النهائي',
      operationNameEn: 'Busbar Installation & Assembly',
      workCenterId: wcAssembly.id,
      assignedEmployeeId: empAssembler.id,
      status: 'IN_PROGRESS',
      plannedHours: 30.0,
      actualHours: 18.0,
      goodQuantity: 6.0,
      scrapQuantity: 0.0,
      startTime: new Date('2026-10-26T08:00:00'),
      notes: 'تم اكتمال تجميع 6 وحدات، وتجري عمليات تجميع 4 وحدات المتبقية',
    },
  });

  const opTesting = await prisma.productionOperation.create({
    data: {
      productionOrderId: prodOrder1.id,
      sequenceOrder: 60,
      operationNameAr: 'فحص العزل الكهربائي واختبار درجة الحماية IP55',
      operationNameEn: 'Electrical Insulation & IP QC Test',
      workCenterId: wcTesting.id,
      assignedEmployeeId: empQC.id,
      status: 'PENDING',
      plannedHours: 6.5,
      actualHours: 0.0,
      goodQuantity: 0.0,
      scrapQuantity: 0.0,
      notes: 'في انتظار اكتمال كافة الوحدات لدخول معمل الاختبارات',
    },
  });

  // Material Requirements for PO-MTO-2026-0012
  await prisma.materialRequirement.createMany({
    data: [
      { productionOrderId: prodOrder1.id, materialProductId: matSteelSheet.id, requiredQuantity: 1800.0, reservedQuantity: 1800.0, issuedQuantity: 1800.0, shortageQuantity: 0.0, unitCostEgp: 52.0, totalCostEgp: 93600.0, status: 'ISSUED' },
      { productionOrderId: prodOrder1.id, materialProductId: matCopperBusbar.id, requiredQuantity: 160.0, reservedQuantity: 160.0, issuedQuantity: 160.0, shortageQuantity: 0.0, unitCostEgp: 380.0, totalCostEgp: 60800.0, status: 'ISSUED' },
      { productionOrderId: prodOrder1.id, materialProductId: matPowderRAL.id, requiredQuantity: 120.0, reservedQuantity: 120.0, issuedQuantity: 120.0, shortageQuantity: 0.0, unitCostEgp: 190.0, totalCostEgp: 22800.0, status: 'ISSUED' },
      { productionOrderId: prodOrder1.id, materialProductId: matBoltsM10.id, requiredQuantity: 840.0, reservedQuantity: 840.0, issuedQuantity: 840.0, shortageQuantity: 0.0, unitCostEgp: 8.5, totalCostEgp: 7140.0, status: 'ISSUED' },
      { productionOrderId: prodOrder1.id, materialProductId: matEPDMGasket.id, requiredQuantity: 180.0, reservedQuantity: 30.0, issuedQuantity: 30.0, shortageQuantity: 150.0, unitCostEgp: 28.0, totalCostEgp: 5040.0, status: 'SHORTAGE' }, // Actual shortage!
    ],
  });

  // Dedicated Material Reservation for SO1
  await prisma.materialReservation.create({
    data: {
      salesOrderId: so1.id,
      productionOrderId: prodOrder1.id,
      materialProductId: matCopperBusbar.id,
      quantityReserved: 160.0,
      status: 'CONSUMED',
    },
  });

  // Purchase Request Automatically Generated by Shortage Engine for SO1!
  const prShortage = await prisma.purchaseRequest.create({
    data: {
      requestNumber: 'PR-MTO-2026-0008',
      salesOrderId: so1.id,
      requestDate: new Date('2026-10-27'),
      requiredDate: new Date('2026-11-05'),
      status: 'PENDING',
      priority: 'URGENT',
      reason: 'عجز في خامة شريط جوان عازل EPDM مطلوب لإنهاء 4 لوحات لأمر مبيعات السويدي SO-2026-0012',
      items: {
        create: [
          {
            productId: matEPDMGasket.id,
            quantity: 300.0, // 150 shortage + 150 buffer
            estimatedUnitCostEgp: 28.0,
            totalEstimatedEgp: 8400.0,
            notes: 'توريد عاجل لتفادي تأخير التسليم',
          },
        ],
      },
    },
  });

  // Quality Inspection Record for the 6 completed units
  await prisma.qualityInspection.create({
    data: {
      inspectionNumber: 'QC-INP-2026-0034',
      type: 'IN_PROCESS',
      referenceType: 'ProductionOrder',
      referenceId: prodOrder1.id,
      productionOrderId: prodOrder1.id,
      productId: prdSwitchgear.id,
      inspectorId: empQC.id,
      inspectedQuantity: 6.0,
      passedQuantity: 6.0,
      rejectedQuantity: 0.0,
      result: 'PASSED',
      inspectionDate: new Date('2026-10-28'),
      notes: 'تم فحص استواء الأبواب وسماكة الدهان ومطابقة عزل الفازات بالكامل وجاءت النتائج مطابقة لكود IEC 61439-1',
    },
  });

  // 16. Confirmed Sales Order 2: Edita (Stainless Steel Pressure Vessel)
  const so2 = await prisma.salesOrder.create({
    data: {
      orderNumber: 'SO-2026-0013',
      customerId: custEdita.id,
      orderDate: new Date('2026-10-20'),
      deliveryDeadline: new Date('2026-11-28'),
      status: 'CONFIRMED',
      subtotalEgp: 275000.0,
      taxRatePercent: 14.0,
      taxAmountEgp: 38500.0,
      whtRatePercent: 1.0,
      whtAmountEgp: 2750.0,
      totalAmountEgp: 310750.0,
      advancePaymentEgp: 137500.0,
      paymentTerms: '50% دفعة مقدمة و50% بعد التركيب والتشغيل التجريبي',
      notes: 'خزان تحضير شراب سكر ستانلس ستيل غذائي 316L سعة 5م3 مع محرك وخلاط بطيء',
      items: {
        create: [
          {
            productId: prdVessel.id,
            quantity: 1.0,
            unitPriceEgp: 275000.0,
            totalPriceEgp: 275000.0,
            deliveryDate: new Date('2026-11-28'),
            customSpecs: 'معدل تشطيب داخلي Ra < 0.4 um ومزود بجاكيت تسخين بالبخار',
          },
        ],
      },
    },
  });

  // 17. Finance & Invoices
  // Invoice for Advance Payment of SO-2026-0012 (Egyptian E-Invoice Format Ready)
  const inv1 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-0021',
      etaUuid: '3F2504E0-4F89-11D3-9A0C-0305E82C3301',
      etaSubmissionStatus: 'Valid',
      salesOrderId: so1.id,
      customerId: custSewedy.id,
      issueDate: new Date('2026-10-16'),
      dueDate: new Date('2026-10-25'),
      subtotalEgp: 200000.0,
      vatRatePercent: 14.0,
      vatAmountEgp: 28000.0,
      whtRatePercent: 1.0,
      whtAmountEgp: 2000.0,
      totalAmountEgp: 226000.0,
      paidAmountEgp: 226000.0,
      paymentStatus: 'PAID',
      notes: 'فاتورة ضريبية إلكترونية - دفعة مقدمة 50% لأمر توريد لوحات توزيع كهربائية SO-2026-0012',
      items: {
        create: [
          {
            productId: prdSwitchgear.id,
            description: 'دفعة مقدمة تعاقدية لتصنيع لوحات توزيع كهربائية 400A جهد منخفض',
            quantity: 1.0,
            unitPriceEgp: 200000.0,
            totalPriceEgp: 200000.0,
            taxAmountEgp: 28000.0,
          },
        ],
      },
    },
  });

  // Payment Record
  await prisma.payment.create({
    data: {
      paymentNumber: 'PAY-2026-0019',
      invoiceId: inv1.id,
      amountEgp: 226000.0,
      paymentDate: new Date('2026-10-18'),
      paymentMethod: 'BANK_TRANSFER',
      referenceNumber: 'TRF-NBE-992381',
      bankName: 'البنك الأهلي المصري - فرع المنطقة الصناعية بالعاشر',
      notes: 'تحويل بنكي سويفت وارد من حساب السويدي للمشروعات',
    },
  });

  // 18. Chart of Accounts (Standard Egyptian Industrial Chart of Accounts)
  const coaData = [
    { code: '1010', nameAr: 'النقدية بالبنوك والعهد (البنك الأهلي المصري)', nameEn: 'Cash & Bank Balances (NBE)', accountType: 'ASSET', balance: 1450000.0 },
    { code: '1020', nameAr: 'أوراق القبض والعملاء التجاريين (AR)', nameEn: 'Accounts Receivable', accountType: 'ASSET', balance: 840000.0 },
    { code: '1030', nameAr: 'مخزون الخامات والمعادن الرئيسية', nameEn: 'Raw Materials Inventory', accountType: 'ASSET', balance: 2450000.0 },
    { code: '1040', nameAr: 'مخزون إنتاج تحت التشغيل (WIP)', nameEn: 'Work-In-Progress Inventory', accountType: 'ASSET', balance: 485000.0 },
    { code: '2010', nameAr: 'الموردون وأوراق الدفع (AP)', nameEn: 'Accounts Payable', accountType: 'LIABILITY', balance: 920000.0 },
    { code: '2020', nameAr: 'مصلحة الضرائب المصرية - ضريبة القيمة المضافة 14%', nameEn: 'Egyptian Tax Authority - VAT Output', accountType: 'LIABILITY', balance: 86800.0 },
    { code: '3010', nameAr: 'رأس المال المدفوع', nameEn: 'Paid-in Capital', accountType: 'EQUITY', balance: 5000000.0 },
    { code: '4010', nameAr: 'إيرادات تصنيع وتوريد منتجات هندسية مخصصة', nameEn: 'MTO Manufacturing Revenue', accountType: 'REVENUE', balance: 3420000.0 },
    { code: '5010', nameAr: 'تكلفة خامات التصنيع المباشرة', nameEn: 'Direct Materials Cost', accountType: 'EXPENSE', balance: 1650000.0 },
    { code: '5020', nameAr: 'تكلفة أجور عمالة التشغيل المباشرة', nameEn: 'Direct Labor Cost', accountType: 'EXPENSE', balance: 340000.0 },
    { code: '5030', nameAr: 'مصاريف صناعية غير مباشرة واستهلاك ماكينات', nameEn: 'Manufacturing Overhead & Depreciation', accountType: 'EXPENSE', balance: 290000.0 },
  ];

  for (const acc of coaData) {
    await prisma.chartOfAccount.create({
      data: {
        accountCode: acc.code,
        nameAr: acc.nameAr,
        nameEn: acc.nameEn,
        accountType: acc.accountType,
        balanceEgp: acc.balance,
      },
    });
  }

  // 19. Initial Audit Log & Notification
  await prisma.auditLog.create({
    data: {
      action: 'SYSTEM_INIT',
      entity: 'Company',
      entityId: company.id,
      details: 'تمت تهيئة نظام FactoryFlow ERP لمصنع العاشر من رمضان بنجاح مع تفعيل الضوابط المصرية وحسابات التكاليف الفعلية MTO',
      ipAddress: '127.0.0.1',
    },
  });

  const adminUser = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  if (adminUser) {
    await prisma.notification.create({
      data: {
        userId: adminUser.id,
        titleAr: 'تنبيه عجز خامات في أمر الإنتاج SO-2026-0012',
        titleEn: 'Material Shortage Alert for SO-2026-0012',
        messageAr: 'يوجد عجز قدره 150 متر في شريط جوان EPDM العازل المطلوب لإنهاء 4 لوحات متبقية للعميل السويدي إلكتريك. تم إصدار طلب شراء PR-MTO-2026-0008.',
        messageEn: '150 meters shortage in EPDM gasket for Elsewedy order. Purchase requisition PR-MTO-2026-0008 has been triggered.',
        type: 'URGENT',
        link: '/procurement/requests',
      },
    });
  }

  console.log('✅ FactoryFlow ERP Database Seeded Successfully with Realistic Egyptian Industrial Data!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
