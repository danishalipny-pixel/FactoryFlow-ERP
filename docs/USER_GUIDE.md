# FactoryFlow ERP — Industrial User Guide

Welcome to the FactoryFlow ERP User Guide. This manual walks factory managers, sales engineers, procurement specialists, shop floor operators, and accountants through day-to-day manufacturing operations.

---

## 1. Navigating the Interface

### Header Bar
- **Factory Identity**: Displays the active operating facility (*Al-Ahram Engineering & Metal Industries, 10th of Ramadan City*).
- **Role Switcher**: Click the **Role** dropdown to instantly switch between any of the 11 enterprise manufacturing roles (Super Admin, Factory Owner, Production Manager, etc.).
- **Language Switcher**: Click the **Language** button to toggle between English (LTR) and native Arabic (RTL).

### Sidebar Workspace
- **Executive Dashboard**: High-level production and financial KPIs.
- **CRM & Sales**: Customer records, quotations, and confirmed sales orders.
- **Engineering & BOM**: Technical drawings, revisions, multi-level BOMs, and work centers.
- **MTO Production**: Order-specific job cards, operations routing, and completion.
- **Inventory & Stores**: Stock on hand, order reservations, and warehouse movements.
- **Procurement**: Shortage purchase requisitions, supplier POs, and goods receipts.
- **Finance & ETA**: Invoicing, Egyptian Tax Authority e-invoicing, payments, and actual COGS costing.
- **Quality Control**: Incoming inspection, in-process testing, and final QA.
- **HR & Workforce**: 14-digit National IDs, shifts, and direct labor wage tracking.
- **Analytical Reports**: Lead time compliance, work center efficiency, and scrap rates.
- **AI Copilot**: Interactive bilingual manufacturing intelligence.
- **Settings**: Statutory Egyptian tax settings and audit logging.

---

## 2. Standard Make-to-Order (MTO) Operating Workflow

### Step 1: Create Customer Account
1. Navigate to **CRM & Sales** -> click **Add Customer**.
2. Enter the customer's legal Arabic and English name, contact person, phone, and Egyptian Tax Registration Number (e.g. `100-988-341`).
3. Set payment terms (e.g. 45 days) and credit limit.

### Step 2: Issue Engineering Quotation
1. In **CRM & Sales**, click **New Quotation**.
2. Select the customer and add finished product line items.
3. The system calculates estimated BOM material and labor costs.
4. Set quotation validity and submit. The 14% Egyptian VAT is automatically calculated.

### Step 3: Confirm Customer Order & Launch MTO Engine
1. When the client signs the contract, open the quotation and click **Confirm Sales Order**.
2. The atomic MTO engine immediately:
   - Explodes the product's multi-level BOM.
   - Evaluates warehouse stock balances.
   - Locks available raw materials exclusively for this order.
   - Generates an urgent **Purchase Request** for any raw material deficit.
   - Spawns a dedicated **Production Order** (`PO-MTO-...`) carrying the customer order number.

### Step 4: Shortage Procurement & Goods Receipt
1. The procurement manager opens **Procurement & Suppliers** and views the auto-generated Purchase Request.
2. Click **Create Purchase Order**, select the supplier (e.g. *Ezz Steel* or *Pachin*), and review the 14% VAT and 1% Withholding Tax.
3. Upon physical delivery at the factory gates, open **Goods Receipts**, enter the supplier delivery note and batch/lot number, and receive the goods. Stock is automatically incremented.

### Step 5: Issue Materials & Execute Work Operations
1. In **MTO Production**, open the active production order.
2. Click **Issue Material to Production** to transfer reserved raw materials to the shop floor.
3. Floor operators update digital Job Cards:
   - **CNC Laser Cutting**: Mark `IN_PROGRESS`, then `COMPLETED`, entering actual machine setup and cut hours.
   - **Press Brake Bending** & **Robotic Welding**: Record actual technician hours and good output.
   - **Electrostatic Powder Coating**: Record curing time and paint batch.
4. The system continuously tallies actual labor and machine overhead costs.

### Step 6: Quality Inspection (QA/QC)
1. Quality engineers open **Quality Control** to log in-process and final checks.
2. Measure coating thickness (e.g. 80 microns) and dimensional tolerances.
3. Mark verdict as `PASSED`, `REWORK_REQUIRED`, or `REJECTED`.

### Step 7: Issue Egyptian Tax Authority E-Invoice
1. In **Finance & Invoicing**, click **Generate Tax Invoice** for the completed sales order.
2. FactoryFlow generates an invoice with:
   - Unique cryptographic document UUID.
   - Egyptian Goods & Services (EGS) item codes (`EG-100245892-...`).
   - 14.0% Value Added Tax (`T1`) and 1.0% Withholding Tax (`T4`).
3. Click **View ETA Payload** to inspect the Document Type Version 1.0 JSON format.
4. Click **Submit to ETA** to register the invoice on the government portal.

### Step 8: Settle Payment & Review Order Profitability
1. When the client transfers funds, click **Record Payment**, entering the bank transfer reference and amount.
2. Open **Order Costing Breakdown** to view the true profit margin:
   $$\text{Gross Margin} = \text{Contracted Revenue} - (\text{Direct Materials} + \text{Direct Labor} + \text{Machine Overhead})$$
