export interface User {
  id: string;
  email: string;
  fullNameAr: string;
  fullNameEn: string;
  role: string;
  languagePreference: string;
  company?: Company;
}

export interface Company {
  id: string;
  nameAr: string;
  nameEn: string;
  commercialRegNo?: string;
  taxRegistrationNo?: string;
  vatRegistrationNo?: string;
  etaIssuerId?: string;
  address?: string;
  city?: string;
  country: string;
  phone?: string;
  email?: string;
  currency: string;
  defaultVatRate: number;
  defaultWhtRate: number;
}

export interface Customer {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  taxRegistrationNo?: string;
  commercialRegNo?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  governorate?: string;
  paymentTermsDays: number;
  creditLimitEgp: number;
  _count?: {
    salesOrders: number;
    quotations: number;
    invoices: number;
  };
}

export interface Product {
  id: string;
  itemCode: string;
  nameAr: string;
  nameEn: string;
  description?: string;
  category: 'RAW_MATERIAL' | 'SUB_ASSEMBLY' | 'FINISHED_PRODUCT' | 'CONSUMABLE';
  unit: string;
  standardCostEgp: number;
  sellingPriceEgp: number;
  drawingNumber?: string;
  revision: string;
  safetyStock: number;
  bom?: BOM;
  routing?: Routing;
}

export interface BOM {
  id: string;
  productId: string;
  product?: Product;
  version: string;
  nameAr: string;
  nameEn: string;
  yieldPercent: number;
  estimatedMaterialCost: number;
  items: BOMItem[];
}

export interface BOMItem {
  id: string;
  componentId: string;
  component: Product;
  quantity: number;
  unit: string;
  scrapPercentage: number;
  notes?: string;
}

export interface WorkCenter {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  capacityHoursPerDay: number;
  hourlyCostRateEgp: number;
  efficiencyPercent: number;
  status: string;
  department?: { nameAr: string };
}

export interface Routing {
  id: string;
  productId: string;
  nameAr: string;
  nameEn: string;
  operations: RoutingOperation[];
}

export interface RoutingOperation {
  id: string;
  sequenceOrder: number;
  nameAr: string;
  nameEn: string;
  workCenterId: string;
  workCenter: WorkCenter;
  setupTimeMinutes: number;
  runTimeMinutesPerUnit: number;
  laborCountRequired: number;
}

export interface Quotation {
  id: string;
  quoteNumber: string;
  customerId: string;
  customer: Customer;
  issueDate: string;
  validUntil: string;
  status: string;
  subtotalEgp: number;
  taxRatePercent: number;
  taxAmountEgp: number;
  totalAmountEgp: number;
  estimatedDeliveryWeeks: number;
  notes?: string;
  items: QuotationItem[];
}

export interface QuotationItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPriceEgp: number;
  estimatedCostEgp: number;
  marginPercent: number;
  totalPriceEgp: number;
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customer: Customer;
  orderDate: string;
  deliveryDeadline: string;
  status: 'DRAFT' | 'CONFIRMED' | 'IN_PRODUCTION' | 'COMPLETED' | 'DELIVERED' | 'CANCELLED';
  subtotalEgp: number;
  taxRatePercent: number;
  taxAmountEgp: number;
  whtRatePercent: number;
  whtAmountEgp: number;
  totalAmountEgp: number;
  advancePaymentEgp: number;
  paymentTerms?: string;
  notes?: string;
  items: SalesOrderItem[];
  productionOrders?: ProductionOrder[];
  invoices?: Invoice[];
}

export interface SalesOrderItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPriceEgp: number;
  totalPriceEgp: number;
  deliveryDate: string;
  customSpecs?: string;
}

export interface ProductionOrder {
  id: string;
  orderNumber: string;
  salesOrderId: string;
  salesOrder?: SalesOrder;
  productId: string;
  product: Product;
  plannedQuantity: number;
  completedQuantity: number;
  scrappedQuantity: number;
  status: 'DRAFT' | 'RELEASED' | 'IN_PROGRESS' | 'QC_INSPECTION' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  plannedStartDate: string;
  plannedDueDate: string;
  actualStartDate?: string;
  actualCompletionDate?: string;
  plannedMaterialCostEgp: number;
  actualMaterialCostEgp: number;
  plannedLaborCostEgp: number;
  actualLaborCostEgp: number;
  plannedOverheadCostEgp: number;
  actualOverheadCostEgp: number;
  totalActualCostEgp: number;
  notes?: string;
  operations: ProductionOperation[];
  materialRequirements: MaterialRequirement[];
}

export interface ProductionOperation {
  id: string;
  productionOrderId: string;
  sequenceOrder: number;
  operationNameAr: string;
  operationNameEn: string;
  workCenterId: string;
  workCenter: WorkCenter;
  assignedEmployeeId?: string;
  assignedEmployee?: Employee;
  status: 'PENDING' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED';
  plannedHours: number;
  actualHours: number;
  goodQuantity: number;
  scrapQuantity: number;
  startTime?: string;
  endTime?: string;
  notes?: string;
}

export interface MaterialRequirement {
  id: string;
  productionOrderId: string;
  materialProductId: string;
  materialProduct: Product;
  requiredQuantity: number;
  reservedQuantity: number;
  issuedQuantity: number;
  shortageQuantity: number;
  unitCostEgp: number;
  totalCostEgp: number;
  status: 'PENDING' | 'RESERVED' | 'ISSUED' | 'PARTIALLY_ISSUED' | 'SHORTAGE';
}

export interface InventoryItem {
  id: string;
  warehouseId: string;
  warehouse: Warehouse;
  productId: string;
  product: Product;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  averageUnitCostEgp: number;
  locationBin?: string;
}

export interface Warehouse {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  location?: string;
}

export interface MaterialReservation {
  id: string;
  salesOrderId: string;
  salesOrder: SalesOrder;
  productionOrderId?: string;
  productionOrder?: ProductionOrder;
  materialProductId: string;
  materialProduct: Product;
  quantityReserved: number;
  status: string;
  reservedAt: string;
}

export interface StockMovement {
  id: string;
  movementNumber: string;
  warehouse: Warehouse;
  product: Product;
  movementType: string;
  quantity: number;
  unitCostEgp: number;
  totalCostEgp: number;
  batchLotNumber?: string;
  performedBy?: string;
  notes?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  taxRegistrationNo?: string;
  commercialRegNo?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  category?: string;
  paymentTermsDays: number;
  rating: number;
}

export interface PurchaseRequest {
  id: string;
  requestNumber: string;
  salesOrderId?: string;
  salesOrder?: SalesOrder;
  requestDate: string;
  requiredDate: string;
  status: string;
  priority: string;
  reason?: string;
  items: {
    id: string;
    product: Product;
    quantity: number;
    estimatedUnitCostEgp: number;
    totalEstimatedEgp: number;
  }[];
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplier: Supplier;
  orderDate: string;
  expectedDeliveryDate: string;
  status: string;
  subtotalEgp: number;
  vatRatePercent: number;
  vatAmountEgp: number;
  whtRatePercent: number;
  whtAmountEgp: number;
  totalAmountEgp: number;
  paymentTerms?: string;
  notes?: string;
  items: {
    id: string;
    productId: string;
    product: Product;
    quantity: number;
    unitPriceEgp: number;
    totalPriceEgp: number;
    quantityReceived: number;
  }[];
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  etaUuid?: string;
  etaSubmissionStatus: string;
  salesOrderId?: string;
  salesOrder?: SalesOrder;
  customerId: string;
  customer: Customer;
  issueDate: string;
  dueDate: string;
  subtotalEgp: number;
  vatRatePercent: number;
  vatAmountEgp: number;
  whtRatePercent: number;
  whtAmountEgp: number;
  totalAmountEgp: number;
  paidAmountEgp: number;
  paymentStatus: string;
  notes?: string;
  items: {
    id: string;
    product: Product;
    description?: string;
    quantity: number;
    unitPriceEgp: number;
    totalPriceEgp: number;
    taxAmountEgp: number;
  }[];
  payments?: Payment[];
}

export interface Payment {
  id: string;
  paymentNumber: string;
  amountEgp: number;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber?: string;
  bankName?: string;
  notes?: string;
}

export interface Employee {
  id: string;
  code: string;
  nationalId?: string;
  firstNameAr: string;
  lastNameAr: string;
  firstNameEn: string;
  lastNameEn: string;
  jobTitleAr: string;
  jobTitleEn: string;
  departmentId: string;
  department: { nameAr: string; nameEn?: string; code: string };
  shift: string;
  hourlyRateEgp: number;
  phone?: string;
  status: string;
}

export interface QualityInspection {
  id: string;
  inspectionNumber: string;
  type: string;
  referenceType: string;
  referenceId: string;
  productionOrder?: ProductionOrder;
  product: Product;
  inspector?: Employee;
  inspectedQuantity: number;
  passedQuantity: number;
  rejectedQuantity: number;
  result: string;
  inspectionDate: string;
  notes?: string;
  defects?: {
    id: string;
    defectCode: string;
    descriptionAr: string;
    severity: string;
    quantityAffected: number;
    actionTaken?: string;
  }[];
}
