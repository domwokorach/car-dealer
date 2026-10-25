import { Injectable } from '@nestjs/common';
import type { Transfer } from '@car-dealer/contracts';
import type { InventoryTransfer as Row } from '@car-dealer/database';
import { Db, PrismaService } from '../../database/prisma.service';

export function toTransfer(r: Row): Transfer {
  return {
    id: r.id,
    stockVehicleId: r.stockVehicleId,
    fromBranchId: r.fromBranchId,
    toBranchId: r.toBranchId,
    status: r.status,
    reason: r.reason,
    createdAt: r.createdAt.toISOString(),
    completedAt: r.completedAt?.toISOString() ?? null,
  };
}

@Injectable()
export class TransfersRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Transfers touching any of the given branches (as sender or receiver). */
  listForBranches(ids: 'all' | string[]) {
    return this.prisma.inventoryTransfer.findMany({
      where: ids === 'all' ? {} : { OR: [{ fromBranchId: { in: ids } }, { toBranchId: { in: ids } }] },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  findById(id: string, db: Db = this.prisma) {
    return db.inventoryTransfer.findUnique({ where: { id } });
  }
}
