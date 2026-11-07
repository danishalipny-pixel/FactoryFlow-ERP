# FactoryFlow ERP — System Architecture & Data Model

This document outlines the architectural principles, domain models, and technical design governing **FactoryFlow ERP**.

---

## 1. Architectural Principles

FactoryFlow ERP is built on five core architectural foundations:

1. **Strict Make-to-Order (MTO) Discipline**:
   - Zero Make-to-Stock speculative production.
   - All production orders (`ProductionOrder`) require an authorized foreign key link to a confirmed sales order (`salesOrderId`).
2. **Order-Specific Inventory Allocation**:
   - Available raw materials are tagged and locked to specific sales orders using `MaterialReservation`.
   - Raw material inventory cannot be poached by competing production orders on the shop floor.
3. **Atomic Transactional Consistency**:
   - Critical manufacturing state transitions (e.g., confirming a sales order, exploding its BOM, checking inventory, locking reserved stock, and emitting shortage purchase requisitions) occur in a single ACID database transaction.
4. **Bilingual Separation of Presentation**:
   - All database models store dual Arabic and English descriptions (`nameAr`, `nameEn`, `jobTitleAr`, `jobTitleEn`).
   - The React frontend strictly separates language states—no mixed or leaking languages.
5. **Egyptian Regulatory Compliance**:
   - Financial models enforce 14% Egyptian VAT (`T1`) and 1% Withholding Tax (`T4` / ضريبة الخصم والإضافة).
   - E-invoicing engine outputs Document Type Version 1.0 JSON with cryptographic UUIDs and EGS item prefix codes (`EG-100245892-...`).

---

## 2. High-Level Architecture Diagram

```mermaid
graph TD
    Client["React 18 + TypeScript + Tailwind Frontend<br/>(Bilingual English LTR / Arabic RTL)"]
    API["Node.js + Express REST API Gateway<br/>(Port 5001 / Africa:Cairo)"]
    Auth["JWT Authentication & RBAC Middleware<br/>(11 Enterprise Roles)"]
    Audit["Audit Logging Subsystem<br/>(Immutable Operation Trail)"]
    MTOEngine["Atomic MTO Business Logic Engine<br/>(BOM Explosion & Shortage Detector)"]
    Costing["Actual Costing Engine<br/>(COGS: Materials + Labor + Overhead)"]
    ETA["Egyptian Tax Authority v1.0 Generator<br/>(UUID + EGS Codes + 14% VAT / 1% WHT)"]
    AICopilot["Bilingual AI Copilot Service<br/>(Live Database Tool Calling)"]
    DB[(Prisma ORM Relational Store<br/>35+ Normalized Models)]

    Client -->|REST JSON + JWT| API
    API --> Auth
    Auth --> Audit
    API --> MTOEngine
    API --> Costing
    API --> ETA
    API --> AICopilot
    MTOEngine --> DB
    Costing --> DB
    ETA --> DB
    AICopilot --> DB
```

---

## 3. Make-to-Order (MTO) Manufacturing Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Egyptian Customer
    participant Sales as Sales & CRM
    participant MTO as MTO Engine
    participant Store as Inventory Store
    participant SCM as Procurement
    participant Shop as Shop Floor Routing
    participant QC as Quality Control
    participant Fin as Finance & ETA

    Customer->>Sales: Request Custom Machinery / Switchgear
    Sales->>Customer: Engineering Quotation (BOM Cost + 14% VAT)
    Customer->>Sales: Approve Quotation & Sign Contract
    Sales->>MTO: Confirm Sales Order (SO-2026-XXXX)
    
    rect rgb(240, 253, 244)
        Note over MTO,Store: Atomic MTO Transaction
        MTO->>MTO: Explode Multi-Level BOM into Components
        MTO->>Store: Check Raw Material Available Stock
        alt Stock Available
            MTO->>Store: Lock MaterialReservation (Tagged to SO)
        else Material Shortage
            MTO->>Store: Reserve Partial Available Stock
            MTO->>SCM: Auto-Generate Urgent PurchaseRequest
        end
        MTO->>Shop: Spawn ProductionOrder (PO-MTO-XXXX)
    end

    SCM->>Store: Issue Vendor PO (14% VAT + 1% WHT) -> Goods Receipt (GRN)
    Store->>Shop: Issue Reserved Materials (Non-Negative Stock)
    Shop->>Shop: Execute Operations (Laser -> Bend -> Weld -> Coat -> Assemble)
    Shop->>Shop: Log Actual Operator Hours & Machine Runtime
    Shop->>QC: Submit Completed Units for Inspection
    QC->>QC: Log Tolerance & Thickness Measurements (PASSED)
    QC->>Fin: Trigger Finished Goods Dispatch Note
    Fin->>Fin: Generate ETA v1.0 E-Invoice (UUID + EGS item codes)
    Fin->>Customer: Issue Tax Invoice
    Customer->>Fin: Wire Transfer Settlement (Status: PAID)
    Fin->>Sales: Calculate Actual COGS Margin & Order Profitability
```

---

## 4. Database Schema & Key Entity Relationships

The relational database comprises 35+ normalized models defined in `server/prisma/schema.prisma`:

### Core Domain Entities
- **Company & Factory**: Registered Egyptian entity details (`taxRegistrationNo`, `commercialRegNo`, `activityCode: 2811`, `location`).
- **Customer & Supplier**: Business partner profiles with commercial terms, tax registration, and credit ratings.
- **Product & ProductVariant**: Finished products, sub-assemblies, and raw materials with dual English/Arabic nomenclature and drawing numbers.
- **BOM & BOMItem**: Multi-level engineering bill of materials with scrap allowances and yield rates.
- **Routing & RoutingOperation**: Sequence of work steps linking work centers, labor requirements, setup times, and run times.
- **WorkCenter**: Manufacturing machines with daily capacity, hourly cost rate in EGP, and mechanical efficiency.
- **SalesOrder & SalesOrderItem**: Authorized customer contracts driving production.
- **ProductionOrder & ProductionOperation**: Shop floor job cards capturing actual runtime hours, assigned operators, good output, and scrap.
- **MaterialRequirement & MaterialReservation**: Material allocations tagged directly to customer orders.
- **Inventory, Warehouse & StockMovement**: Non-negative inventory balances and immutable movement history.
- **PurchaseRequest, PurchaseOrder & GoodsReceipt**: Vendor procurement with 14% VAT, 1% WHT, and batch/lot tracking.
- **QualityInspection & QualityDefect**: Incoming, in-process, and final inspection logs with severity ratings.
- **Invoice, InvoiceItem & Payment**: Egyptian statutory invoices, ETA v1.0 JSON payloads with UUIDs, and payment reconciliation.
- **Employee, Department & Attendance**: Workforce profiles with 14-digit Egyptian National IDs, shifts, and wage rates.
- **AuditLog**: Immutable system audit trail capturing user identity, action type, resource ID, and operational details.
