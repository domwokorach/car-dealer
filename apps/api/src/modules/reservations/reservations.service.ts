import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Reservation, SessionUser } from '@car-dealer/contracts';
import { addMinutes } from '@car-dealer/utils';
import { ENV } from '../../config/config.module';
import type { Env } from '../../config/env';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { canAccessBranch, scopeBranchFilter } from '../auth/access-policy';
import { OutboxService } from '../notifications/outbox.service';
import type { CreateReservationDto } from './dto/create-reservation.dto';
import { ReservationsRepository, toReservation } from './reservations.repository';

@Injectable()
export class ReservationsService {
  constructor(
    @Inject(ENV) private readonly env: Env,
    private readonly prisma: PrismaService,
    private readonly repo: ReservationsRepository,
    private readonly audit: AuditService,
    private readonly outbox: OutboxService,
  ) {}

  /**
   * Atomic, idempotent hold.
   * 1. `SELECT ... FOR UPDATE` on the vehicle serialises competing buyers; the loser re-reads the committed state.
   * 2. The partial unique index `reservations_one_active_per_vehicle` is the database-level backstop.
   * 3. The price is snapshotted from the locked row, so later price edits never change the agreed price.
   */
  reserve(user: SessionUser, dto: CreateReservationDto): Promise<Reservation> {
    return this.prisma.$transaction(
      async (tx) => {
        const listing = await tx.listing.findFirst({
          where: { id: dto.listingId, status: 'PUBLISHED' },
          select: { stockVehicleId: true },
        });
        if (!listing) throw new NotFoundException('Listing not found');
        const stockVehicleId = listing.stockVehicleId;

        await this.prisma.lockStockVehicle(tx, stockVehicleId);

        const replay = await tx.reservation.findUnique({ where: { idempotencyKey: dto.idempotencyKey } });
        if (replay) {
          if (replay.profileId !== user.id || replay.stockVehicleId !== stockVehicleId) {
            throw new ConflictException('Idempotency key already used');
          }
          return toReservation(replay);
        }

        await this.repo.expireLapsed(tx, stockVehicleId);

        const vehicle = await tx.stockVehicle.findUniqueOrThrow({ where: { id: stockVehicleId } });
        if (vehicle.status !== 'AVAILABLE') throw new ConflictException('Vehicle is not available to reserve');

        const row = await tx.reservation.create({
          data: {
            stockVehicleId,
            branchId: vehicle.branchId,
            profileId: user.id,
            idempotencyKey: dto.idempotencyKey,
            pricePence: vehicle.askingPricePence,
            expiresAt: addMinutes(new Date(), this.env.RESERVATION_HOLD_MINUTES),
          },
        });
        await tx.stockVehicle.update({ where: { id: stockVehicleId }, data: { status: 'RESERVED' } });
        await this.audit.record(tx, {
          actorId: user.id,
          branchId: vehicle.branchId,
          entityType: 'reservation',
          entityId: row.id,
          action: 'reservation.created',
          changes: { stockVehicleId, pricePence: row.pricePence },
        });
        await this.outbox.enqueue(tx, 'reservation.created', { reservationId: row.id, branchId: vehicle.branchId });
        return toReservation(row);
      },
      { maxWait: 10_000, timeout: 15_000 },
    );
  }

  async mine(user: SessionUser): Promise<Reservation[]> {
    return (await this.repo.mine(user.id)).map(toReservation);
  }

  async listForStaff(user: SessionUser): Promise<Reservation[]> {
    return (await this.repo.activeForBranches(scopeBranchFilter(user))).map(toReservation);
  }

  /** The owner or branch staff may cancel an active hold. */
  cancel(user: SessionUser, id: string): Promise<Reservation> {
    return this.prisma.$transaction(async (tx) => {
      const found = await this.repo.findById(id, tx);
      if (!found) throw new NotFoundException('Reservation not found');
      if (found.profileId !== user.id && !canAccessBranch(user, found.branchId)) {
        throw new NotFoundException('Reservation not found');
      }
      await this.prisma.lockStockVehicle(tx, found.stockVehicleId);
      const current = await this.repo.findById(id, tx);
      if (current?.status !== 'ACTIVE') throw new ConflictException('Reservation is no longer active');

      const row = await tx.reservation.update({ where: { id }, data: { status: 'CANCELLED' } });
      await this.repo.releaseIfFree(tx, found.stockVehicleId);
      await this.audit.record(tx, {
        actorId: user.id,
        branchId: found.branchId,
        entityType: 'reservation',
        entityId: id,
        action: 'reservation.cancelled',
      });
      return toReservation(row);
    });
  }

  /** Periodic sweep for holds nobody touched again. Safe to run from several instances. */
  expireAbandoned(): Promise<number> {
    return this.prisma.$transaction(async (tx) => {
      const vehicles = await this.repo.lapsedVehicleIds(tx);
      for (const v of vehicles) await this.repo.expireLapsed(tx, v.id);
      return vehicles.length;
    });
  }
}
