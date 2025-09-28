import { prisma } from './prisma';

export interface AuditLogData {
  entityType: 'USER' | 'CARD' | 'CHARACTER' | 'MISSION' | 'SET' | 'STRIKE_TEAM' | 'CUSTOM_CARD' | 'COLLECTION' | 'SYSTEM_SETTINGS';
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'ROLE_CHANGE' | 'STATUS_CHANGE' | 'PUBLISH' | 'UNPUBLISH' | 'SHARE' | 'UNSHARE';
  userId?: string;
  changes?: any;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAuditEvent(data: AuditLogData) {
  try {
    await prisma.auditLog.create({
      data: {
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        userId: data.userId,
        changes: data.changes,
        description: data.description,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Don't throw - audit logging should not break the main functionality
  }
}

export async function getAuditLogs(filters?: {
  entityType?: string;
  entityId?: string;
  userId?: string;
  action?: string;
  limit?: number;
  offset?: number;
}) {
  const where: any = {};
  
  if (filters?.entityType) where.entityType = filters.entityType;
  if (filters?.entityId) where.entityId = filters.entityId;
  if (filters?.userId) where.userId = filters.userId;
  if (filters?.action) where.action = filters.action;

  const logs = await prisma.auditLog.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: filters?.limit || 100,
    skip: filters?.offset || 0,
  });

  return logs;
}
