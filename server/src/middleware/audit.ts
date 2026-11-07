import { Request } from 'express';
import { prisma } from '../prisma';

export async function logAudit(
  req: Request,
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'CONFIRM' | 'ISSUE' | 'POST' | 'CANCEL',
  entity: string,
  entityId: string,
  details?: Record<string, any> | string
) {
  try {
    const userId = req.user?.id;
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const detailString = typeof details === 'object' ? JSON.stringify(details) : details;

    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        details: detailString,
        ipAddress: String(ipAddress),
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}
