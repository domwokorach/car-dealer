import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { SessionUser, Transfer } from '@car-dealer/contracts';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { accessibleBranchIds, assertBranchAccess } from '../auth/access-policy';
import { OutboxService } from '../notifications/outbox.service';
import type { CreateTransferDto } from './dto/create-transfer.dto';
import { TransfersRepository, toTransfer } from './transfers.repository';

@Injectable()
export class TransfersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repo: TransfersRepository,
    private readonly audit: AuditService,
    private readonly outbox: OutboxService,
  ) {}

  async list(user: SessionUser): Promise<Transfer[]> {
    return (await this.repo.listForBranches(accessibleBranchIds(user))).map(toTransfer);
  }

  /** The sending branch's manager (or head office) requests the move; the vehicle leaves sale while in transit. */
  request(user: SessionUser, dto: CreateTransferDto): Promise<Transfer> {
    return this.prisma.$transaction(async (tx) => {
      await this.prisma.lockStockVehicle(tx, dto.stockVehicleId);
      const vehicle = await tx.stockVehicle.findUnique({ where: { id: dto.stockVehicleId } });
      if (!vehicle) throw new NotFoundException('Vehicle not found');
      assertBranchAccess(user, vehicle.branchId, 'BRANCH_MANAGER');

      if (dto.toBranchId === vehicle.branchId) throw new BadRequestException('Vehicle is already at that branch');
      const target = await tx.branch.findFirst({ where: { id: dto.toBranchId, isActive: true } });
      if (!target) throw new NotFoundException('Destination branch not found');
      if (vehicle.status !== 'AVAILABLE') throw new ConflictException(`Cannot transfer a vehicle that is ${vehicle.status}`);

      const row = await tx.inventoryTransfer.create({
        data: {
          stockVehicleId: vehicle.id,
          fromBranchId: vehicle.branchId,
          toBranchId: dto.toBranchId,
          requestedById: user.id,
          reason: dto.reason,
        },
      });
      await tx.stockVehicle.update({ where: { id: vehicle.id }, data: { status: 'IN_TRANSIT' } });
      await this.audit.record(tx, {
        actorId: user.id,
        branchId: vehicle.branchId,
        entityType: 'inventory_transfer',
        entityId: row.id,
        action: 'transfer.requested',
        changes: { from: vehicle.branchId, to: dto.toBranchId },
      });
      return toTransfer(row);
    });
  }

  /**
   * Receiving branch's manager (or head office) confirms arrival. Ownership, vehicle status and the transfer
   * record change in ONE transaction under the vehicle lock, so a vehicle is never owned by two branches.
   */
  complete(user: SessionUser, id: string): Promise<Transfer> {
    return this.prisma.$transaction(async (tx) => {
      const found = await this.repo.findById(id, tx);
      if (!found) throw new NotFoundException('Transfer not found');
      assertBranchAccess(user, found.toBranchId, 'BRANCH_MANAGER');

      await this.prisma.lockStockVehicle(tx, found.stockVehicleId);
      const transfer = await this.repo.findById(id, tx);
      if (transfer?.status !== 'REQUESTED') throw new ConflictException('Transfer is not pending');

      await tx.stockVehicle.update({
        where: { id: transfer.stockVehicleId },
        data: { branchId: transfer.toBranchId, status: 'AVAILABLE' },
      });
      const row = await tx.inventoryTransfer.update({
        where: { id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
      await this.audit.record(tx, {
        actorId: user.id,
        branchId: transfer.toBranchId,
        entityType: 'inventory_transfer',
        entityId: id,
        action: 'transfer.completed',
        changes: { stockVehicleId: transfer.stockVehicleId, from: transfer.fromBranchId, to: transfer.toBranchId },
      });
      await this.outbox.enqueue(tx, 'transfer.completed', { transferId: id });
      return toTransfer(row);
    });
  }

  cancel(user: SessionUser, id: string): Promise<Transfer> {
    return this.prisma.$transaction(async (tx) => {
      const found = await this.repo.findById(id, tx);
      if (!found) throw new NotFoundException('Transfer not found');
      assertBranchAccess(user, found.fromBranchId, 'BRANCH_MANAGER');

      await this.prisma.lockStockVehicle(tx, found.stockVehicleId);
      const transfer = await this.repo.findById(id, tx);
      if (transfer?.status !== 'REQUESTED') throw new ConflictException('Transfer is not pending');

      await tx.stockVehicle.update({ where: { id: transfer.stockVehicleId }, data: { status: 'AVAILABLE' } });
      const row = await tx.inventoryTransfer.update({ where: { id }, data: { status: 'CANCELLED' } });
      await this.audit.record(tx, {
        actorId: user.id,
        branchId: transfer.fromBranchId,
        entityType: 'inventory_transfer',
        entityId: id,
        action: 'transfer.cancelled',
      });
      return toTransfer(row);
    });
  }
}
