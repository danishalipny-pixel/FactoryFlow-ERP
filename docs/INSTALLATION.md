# FactoryFlow ERP — Installation & Deployment Guide

This guide provides end-to-end instructions for installing, configuring, and deploying **FactoryFlow ERP** in development and production environments.

---

## 1. System Requirements

### Hardware Prerequisites
- **CPU**: 2 cores minimum (4 cores recommended for production)
- **RAM**: 4 GB minimum (8 GB recommended)
- **Disk Space**: 2 GB free space

### Software Prerequisites
- **Node.js**: v18.0.0 or higher (v20 LTS recommended)
- **npm**: v9.0.0 or higher
- **Database Engine**:
  - Development: SQLite (default zero-configuration engine included)
  - Production: PostgreSQL 14+ or SQLite

---

## 2. Quickstart Installation (5 Minutes)

### Step 1: Clone Repository
```bash
git clone https://github.com/danishalipny-pixel/FactoryFlow-ERP.git
cd FactoryFlow-ERP
```

### Step 2: Install Dependencies
Install all backend and frontend packages via the root orchestrator:
```bash
npm run install:all
```
*(Alternatively, run `npm install` inside both `server/` and `client/` directories.)*

### Step 3: Configure Environment Variables
Create the backend configuration file from the template:
```bash
cp .env.example server/.env
```
Key configuration items in `server/.env`:
```ini
PORT=5001
NODE_ENV=development
DATABASE_URL="file:./dev.db"
JWT_SECRET=factoryflow_egypt_enterprise_secret_key_2026_mto
JWT_EXPIRES_IN=7d
FACTORY_TIMEZONE=Africa/Cairo
DEFAULT_VAT_RATE=14.0
DEFAULT_WHT_RATE=1.0
```

### Step 4: Initialize Relational Database
Push the Prisma schema to the database and seed the realistic Egyptian factory dataset:
```bash
# Push schema tables and constraints
npm run prisma:push

# Populate Al-Ahram Metal Industries (10th of Ramadan) dataset
npm run prisma:seed
```

### Step 5: Start Development Services
Open two terminal windows:

**Terminal 1 (Backend API):**
```bash
npm run dev:server
```
*Output: `🏭 FactoryFlow ERP Backend running on http://localhost:5001`*

**Terminal 2 (Frontend Client):**
```bash
npm run dev:client
```
*Output: `➜ Local: http://localhost:5173/`*

### Step 6: Access the Application
Open your web browser and navigate to:
**[http://localhost:5173/](http://localhost:5173/)**

Use any of the pre-configured demo user accounts (Password for all: `FactoryFlow@2026`):
- **Super Admin**: `admin@factoryflow.eg`
- **Factory Owner**: `owner@alahram-metal.eg`
- **Sales Manager**: `sales@alahram-metal.eg`
- **Production Manager**: `production@alahram-metal.eg`
- **Chief Accountant**: `finance@alahram-metal.eg`

---

## 3. Running Automated Tests

FactoryFlow ERP includes a comprehensive end-to-end integration test suite verifying the complete 16-step Make-to-Order lifecycle:
```bash
npm run test:mto
```
This tests:
1. System Health & Egyptian Localization
2. JWT Authentication & 1-Click Role Switcher
3. Customer Registration with Egyptian TRN/CR
4. Multi-Level BOM Cost Estimation & Quotations
5. Order Confirmation & Atomic MTO Production Engine Trigger
6. BOM Explosion & Automatic Shortage Purchase Requisitions
7. Supplier POs with 14% VAT and 1% Withholding Tax
8. Goods Receipt Notes (GRN) & Stock Movement
9. Order-Specific Inventory Reservation Locks
10. Material Issuance to the Shop Floor (Non-Negative Stock)
11. Work Operations Execution & Operator Labor Hours
12. In-Process & Final QA/QC Tolerance Inspections
13. Production Order Completion
14. Egyptian Tax Authority (ETA) v1.0 E-Invoice Generation with UUID
15. ETA Portal Submission & Wire Transfer Payment Settlement
16. Actual COGS Costing (Materials + Labor + Overhead) & Margin Analysis

---

## 4. Production Build & Deployment

### Build Artifacts
Generate optimized production bundles for both services:
```bash
npm run build
```
This creates:
- `server/dist/` — Compiled CommonJS backend binaries
- `client/dist/` — Minified, code-split frontend assets

### Running Production Server
```bash
cd server
npm run start
```

### Serving Frontend via Nginx
Example Nginx configuration block:
```nginx
server {
    listen 80;
    server_name erp.factoryflow.eg;

    location / {
        root /var/www/factoryflow/client/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:5001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Upgrading to PostgreSQL in Production
To switch from SQLite to PostgreSQL:
1. Update `server/prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Update `DATABASE_URL` in `server/.env`:
   ```ini
   DATABASE_URL="postgresql://user:password@localhost:5432/factoryflow_db?schema=public"
   ```
3. Run `npx prisma db push && npx prisma db seed` inside `server/`.
