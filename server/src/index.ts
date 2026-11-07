import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { prisma } from './prisma';
import authRoutes from './routes/auth.routes';
import dashboardRoutes from './routes/dashboard.routes';
import salesRoutes from './routes/sales.routes';
import engineeringRoutes from './routes/engineering.routes';
import productionRoutes from './routes/production.routes';
import inventoryRoutes from './routes/inventory.routes';
import procurementRoutes from './routes/procurement.routes';
import financeRoutes from './routes/finance.routes';
import hrRoutes from './routes/hr.routes';
import qualityRoutes from './routes/quality.routes';
import reportsRoutes from './routes/reports.routes';
import aiRoutes from './routes/ai.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Request logger for API calls
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.originalUrl.startsWith('/api')) {
      console.log(`[${req.method}] ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/engineering', engineeringRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/procurement', procurementRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/quality', qualityRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/ai', aiRoutes);

// Health Check
app.get('/api/health', async (req, res) => {
  const company = await prisma.company.findFirst();
  res.json({
    status: 'ONLINE',
    system: 'FACTORYFLOW ERP - Egypt MTO Manufacturing System',
    timezone: process.env.FACTORY_TIMEZONE || 'Africa/Cairo',
    country: company?.country || 'EG',
    company: company ? {
      nameAr: company.nameAr,
      nameEn: company.nameEn,
      taxRegistrationNo: company.taxRegistrationNo,
      country: company.country,
    } : { country: 'EG' },
    timestamp: new Date().toISOString(),
  });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    error: 'حدث خطأ غير متوقع في الخادم (Internal Server Error)',
    message: err.message,
  });
});

app.listen(PORT, () => {
  console.log(`🏭 FactoryFlow ERP Backend running on http://localhost:${PORT}`);
  console.log(`🇪🇬 Configured for Egyptian Industrial Operations (Africa/Cairo)`);
});
