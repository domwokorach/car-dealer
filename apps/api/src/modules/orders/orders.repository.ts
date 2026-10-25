import { Injectable } from '@nestjs/common';
import type { Order } from '@car-dealer/contracts';
import type { Order as Row } from '@car-dealer/database';
import { Db, PrismaService } from '../../database/prisma.service';

export function toOrder(r: Row): Order {
  return {
    id: r.id,
    stockVehicleId: r.stockVehicleId,
    branchId: r.branchId,
    profileId: r.profileId,
    status: r.status,
    agreedPricePence: r.agreedPricePence,
    createdAt: r.createdAt.toISOString(),
  };
}

@Injectable()
export class OrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  forBranches(branchFilter: { branchId?: string | { in: string[] } }) {
    return this.prisma.order.findMany({ where: branchFilter, orderBy: { createdAt: 'desc' }, take: 200 });
  }

  mine(profileId: string) {
    return this.prisma.order.findMany({ where: { profileId }, orderBy: { createdAt: 'desc' } });
  }

  findById(id: string, db: Db = this.prisma) {
    return db.order.findUnique({ where: { id } });
  }
}
