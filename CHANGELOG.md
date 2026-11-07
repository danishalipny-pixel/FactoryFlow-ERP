# Changelog

All notable changes to **FactoryFlow ERP** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-11-06

### Added
- **Core Make-to-Order (MTO) Engine**:
  - Zero Make-to-Stock policy enforcing customer order traceability across all production workflows.
  - Multi-level Bill of Materials (BOM) explosion with yield percentages and scrap allowances.
  - Automated inventory reservation locking allocated stock per customer order.
  - Shortage detection engine automatically generating urgent Purchase Requisitions upon BOM deficit.
  - Actual Cost of Goods Sold (COGS) tracking combining Direct Materials, Direct Labor, and Machine Overhead against contracted revenue.
- **22 Integrated ERP Modules**:
  - Executive Dashboard, CRM & Customer Management, Sales & Quotations, Customer Orders (MTO), Product Catalog, Bill of Materials (BOM), Material Requirement Planning (MRP), Production Orders, Production Scheduling, Work Centers, Inventory & Warehousing, Supplier Management, Procurement & POs, Quality Control (QA/QC), Finance & Accounting, Invoices & Payments, HR & Employees, Attendance & Direct Labor Payroll, AI Manufacturing Copilot, Business Intelligence Reports, RBAC User Roles, System Settings & Audit Logs.
- **Egyptian Market Localization**:
  - Currency formatting in Egyptian Pounds (`EGP` / `ج.م`) with Cairo timezone (`Africa/Cairo` UTC+2).
  - Configurable statutory 14.0% Value Added Tax (`VAT T1`) and 1.0% Withholding Tax (`WHT T4` / ضريبة الخصم والإضافة).
  - Egyptian Tax Authority (ETA) Version 1.0 e-invoicing JSON document builder with cryptographic UUID and EGS item coding (`EG-100245892-...`).
  - Egyptian Tax Registration Numbers (TRN / البطاقة الضريبية) and Commercial Registration (CR) records.
  - Complete industrial Arabic translation with native Right-to-Left (RTL) layout mirroring and instant 1-click toggle.
- **AI Manufacturing Copilot**:
  - Bilingual natural language query engine supporting both English and Arabic.
  - Real database tool calling retrieving live metrics for delayed jobs, material shortages, and actual order costing without hallucinations.
  - Optional OpenAI API integration with server-side key protection.
- **Role-Based Access Control (RBAC)**:
  - 11 pre-configured enterprise manufacturing roles with an instant role-switcher navbar dropdown.
  - JWT authentication with bcryptjs password hashing and audit logging.
- **Automated Integration Test Suite**:
  - 57/57 automated end-to-end integration tests verifying the complete 16-step MTO lifecycle on real database transactions.

---

## [0.9.0] - 2026-10-25

### Added
- Initial relational database schema with 35+ normalized Prisma models.
- Seed dataset modeled for *Al-Ahram Engineering & Metal Industries S.A.E.* (10th of Ramadan City).
- Express.js REST API skeleton and React 18 TypeScript frontend foundation.
