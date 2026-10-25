import { Injectable } from '@nestjs/common';
import type { Reservation } from '@car-dealer/contracts';
import type { Reservation as Row } from '@car-dealer/database';
import { Db, PrismaService } from '../../database/prisma.service';

export function toReservation(r: Row): Reservation {
  return {
    id: r.id,
    stockVehicleId: r.stockVehicleId,
    branchId: r.branchId,
    status: r.status,
    pricePence: r.pricePence,
    expiresAt: r.expiresAt.toISOString(),
    createdAt: r.createdAt.toISOString(),
  };
}

@Injectable()
export class ReservationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  mine(profileId: string) {
    return this.prisma.reservation.findMany({ where: { profileId }, orderBy: { createdAt: 'desc' } });
  }

  activeForBranches(branchFilter: { branchId?: string | { in: string[] } }) {
    return this.prisma.reservation.findMany({
      where: { status: 'ACTIVE', ...branchFilter },
      orderBy: { expiresAt: 'asc' },
      take: 200,
    });
  }

  findById(id: string, db: Db = this.prisma) {
    return db.reservation.findUnique({ where: { id } });
  }

  /** Mark lapsed holds EXPIRED for one (already locked) vehicle and release it unless a sale is in progress. */
  async expireLapsed(db: Db, stockVehicleId: string): Promise<number> {
    const { count } = await db.reservation.updateMany({
      where: { stockVehicleId, status: 'ACTIVE', expiresAt: { lte: new Date() } },
      data: { status: 'EXPIRED' },
    });
    if (count > 0) await this.releaseIfFree(db, stockVehicleId);
    return count;
  }

  /** RESERVED → AVAILABLE iff no active reservation and no live order remain. */
  async releaseIfFree(db: Db, stockVehicleId: string) {
    await db.stockVehicle.updateMany({
      where: {
        id: stockVehicleId,
        status: 'RESERVED',
        reservations: { none: { status: 'ACTIVE' } },
        orders: { none: { status: { not: 'CANCELLED' } } },
      },
      data: { status: 'AVAILABLE' },
    });
  }

  /** Vehicles with lapsed holds, locked with SKIP LOCKED so several API instances can sweep safely. */
  lapsedVehicleIds(db: Db): Promise<{ id: string }[]> {
    // Bind the instant as a parameter: Prisma DateTime columns are timezone-less UTC, so SQL now() is unsafe here.
    const now = new Date();
    return db.$queryRaw<{ id: string }[]>`
      SELECT s."id" FROM "stock_vehicles" s
      WHERE EXISTS (SELECT 1 FROM "reservations" r
                    WHERE r."stockVehicleId" = s."id" AND r."status" = 'ACTIVE' AND r."expiresAt" <= ${now})
      FOR UPDATE OF s SKIP LOCKED`;
  }
}
