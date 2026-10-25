import { Injectable } from '@nestjs/common';
import { Prisma } from '@car-dealer/database';
import type { ListAuditQuery } from '@car-dealer/contracts';
import { Db, PrismaService } from '../../database/prisma.service';

export interface AuditEntry {
  actorId?: string | null;
  branchId?: string | null;
  entityType: string;
  entityId: string;
  action: string;
  changes?: Prisma.InputJsonValue;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /** Pass the transaction client so the audit row commits or rolls back with the change it describes. */
  async record(db: Db, entry: AuditEntry): Promise<void> {
    await db.auditEvent.create({
      data: {
        actorId: entry.actorId ?? null,
        branchId: entry.branchId ?? null,
        entityType: entry.entityType,
        entityId: entry.entityId,
        action: entry.action,
        changes: entry.changes ?? Prisma.JsonNull,
      },
    });
  }

  async list(query: ListAuditQuery) {
    const where: Prisma.AuditEventWhereInput = {
      entityType: query.entityType,
      entityId: query.entityId,
      branchId: query.branchId,
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.auditEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.auditEvent.count({ where }),
    ]);
    return {
      items: rows.map((r) => ({
        id: r.id,
        actorId: r.actorId,
        branchId: r.branchId,
        entityType: r.entityType,
        entityId: r.entityId,
        action: r.action,
        changes: r.changes,
        createdAt: r.createdAt.toISOString(),
      })),
      page: query.page,
      pageSize: query.pageSize,
      total,
    };
  }
}
