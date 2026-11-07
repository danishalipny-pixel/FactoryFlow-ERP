import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
import { authenticateToken, requireRoles } from '../middleware/auth';
import { logAudit } from '../middleware/audit';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'factoryflow_egypt_enterprise_secret_key_2026_mto';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبان' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'بيانات تسجيل الدخول غير صحيحة أو الحساب معطل' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'بيانات تسجيل الدخول غير صحيحة' });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        fullNameAr: user.fullNameAr,
        fullNameEn: user.fullNameEn,
        companyId: user.companyId,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    await logAudit(req, 'APPROVE', 'User', user.id, `تسجيل دخول ناجح للمستخدم: ${user.fullNameAr}`);

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullNameAr: user.fullNameAr,
        fullNameEn: user.fullNameEn,
        role: user.role,
        languagePreference: user.languagePreference,
        company: user.company,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'حدث خطأ في الخادم أثناء تسجيل الدخول' });
  }
});

// Current User Info
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        company: true,
        notifications: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        fullNameAr: user.fullNameAr,
        fullNameEn: user.fullNameEn,
        role: user.role,
        languagePreference: user.languagePreference,
        company: user.company,
        notifications: user.notifications,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'فشل استرجاع بيانات المستخدم' });
  }
});

// Quick Switch Role (for demo and enterprise role testing)
router.post('/switch-role', authenticateToken, async (req: Request, res: Response) => {
  const { targetRole } = req.body;
  if (!targetRole) {
    return res.status(400).json({ error: 'الدور المستهدف مطلوب' });
  }

  try {
    const targetUser = await prisma.user.findFirst({
      where: { role: targetRole },
      include: { company: true },
    });

    if (!targetUser) {
      return res.status(404).json({ error: `لم يتم العثور على مستخدم بالدور: ${targetRole}` });
    }

    const token = jwt.sign(
      {
        id: targetUser.id,
        email: targetUser.email,
        role: targetUser.role,
        fullNameAr: targetUser.fullNameAr,
        fullNameEn: targetUser.fullNameEn,
        companyId: targetUser.companyId,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        fullNameAr: targetUser.fullNameAr,
        fullNameEn: targetUser.fullNameEn,
        role: targetUser.role,
        languagePreference: targetUser.languagePreference,
        company: targetUser.company,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'فشل التبديل بين الأدوار' });
  }
});

// List Users
router.get('/users', authenticateToken, async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullNameAr: true,
        fullNameEn: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    return res.json({ users });
  } catch (error) {
    return res.status(500).json({ error: 'فشل استرجاع قائمة المستخدمين' });
  }
});

// Audit Logs
router.get('/audit-logs', authenticateToken, requireRoles(['SUPER_ADMIN', 'FACTORY_OWNER', 'GENERAL_MANAGER']), async (req: Request, res: Response) => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: {
        user: {
          select: { fullNameAr: true, fullNameEn: true, role: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return res.json({ logs });
  } catch (error) {
    return res.status(500).json({ error: 'فشل استرجاع سجل التدقيق والرقابة' });
  }
});

export default router;
