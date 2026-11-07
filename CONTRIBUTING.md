# Contributing to FactoryFlow ERP

Thank you for your interest in contributing to **FactoryFlow ERP**! As an enterprise-grade Make-to-Order Manufacturing ERP designed for Egyptian industrial factories, we maintain high standards for code quality, architectural consistency, and security.

---

## Code of Conduct

We expect all contributors to adhere to standard professional etiquette. Treat everyone with respect, prioritize constructive collaboration, and uphold manufacturing data integrity.

---

## Development Workflow

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher
- **Git**

### 2. Fork and Clone
```bash
git clone https://github.com/danishalipny-pixel/FactoryFlow-ERP.git
cd FactoryFlow-ERP
```

### 3. Install Dependencies
```bash
npm run install:all
```

### 4. Setup Database
```bash
npm run prisma:push
npm run prisma:seed
```

### 5. Start Development Servers
In separate terminal windows:
```bash
# Terminal 1: Backend API (port 5001)
npm run dev:server

# Terminal 2: Frontend Client (port 5173)
npm run dev:client
```

---

## Contribution Guidelines

### 1. Strict Make-to-Order (MTO) Business Logic
- **Never introduce Make-to-Stock (MTS) workflows**: Production orders must remain strictly traceable to an authorized customer order (`salesOrderId`).
- **Never allow negative inventory**: Always verify stock availability before recording inventory movements or issues.
- **Maintain atomic transactions**: All multi-step manufacturing operations (e.g., BOM explosion -> stock reservation -> shortage PR creation) must be wrapped in Prisma transactions (`prisma.$transaction`).

### 2. Bilingual Presentation & Zero Mixed Language
- All source code, schema fields, API routes, types, comments, and documentation must be written in **English**.
- In the frontend, UI strings must use the language context (`useLanguage()`).
- In English mode (`en`), never leak raw Arabic strings (except Egyptian legal registered names).
- In Arabic mode (`ar`), provide authentic industrial Egyptian manufacturing terminology with native RTL layout.

### 3. Egyptian Statutory Compliance
- Maintain 14% Egyptian VAT (`T1`) and 1% Withholding Tax (`T4`) calculations.
- Preserve Africa/Cairo timezone and Egyptian Pound (`EGP`) formatting conventions.
- Adhere to Egyptian Tax Authority (ETA) v1.0 e-invoicing schema standards.

### 4. Code Quality & Verification
Before submitting any pull request:
```bash
# 1. Verify Client Build
npm run build:client

# 2. Verify Server Build
npm run build:server

# 3. Run Automated MTO Integration Tests
npm run test:mto
```
All 57 automated tests must pass with zero errors.

---

## Commit Message Convention

Use conventional commits:
- `feat:` New module or feature capability
- `fix:` Bug fix or calculation correction
- `docs:` Documentation improvements
- `refactor:` Code restructuring without functional change
- `test:` Test additions or verifications
- `chore:` Dependency or tooling updates

Example:
```bash
git commit -m "feat(procurement): add supplier withholding tax T4 validation"
```
