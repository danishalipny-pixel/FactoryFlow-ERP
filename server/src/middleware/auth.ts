import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  fullNameAr: string;
  fullNameEn: string;
  companyId?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'factoryflow_egypt_enterprise_secret_key_2026_mto';

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'لم يتم توفير رمز المصادقة (Authentication token required)' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        fullNameAr: true,
        fullNameEn: true,
        companyId: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(403).json({ error: 'الحساب غير نشط أو تم إلغاؤه (Account inactive or suspended)' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'رمز المصادقة غير صالح أو منتهي الصلاحية (Invalid or expired token)' });
  }
};

export const requireRoles = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'غير مصرح بالوصول (Unauthorized)' });
    }

    // Super Admin and Factory Owner have full access
    if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'FACTORY_OWNER') {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `غير مصرح لرتبتك (${req.user.role}) بتنفيذ هذا الإجراء (Access denied for role: ${req.user.role})`,
      });
    }

    next();
  };
};
