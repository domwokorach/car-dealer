import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { SessionUser, StockVehicle } from '@car-dealer/contracts';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { assertBranchAccess, scopeBranchFilter } from '../auth/access-policy';
import type { CreateVehicleDto } from './dto/create-vehicle.dto';
import type { ListVehiclesDto } from './dto/list-vehicles.dto';
import type { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { InventoryRepository, toStockVehicle } from './inventory.repository';

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repo: InventoryRepository,
    private readonly audit: AuditService,
  ) {}

  async list(user: SessionUser, query: ListVehiclesDto) {
    // The branch filter is derived from the server-side session; a requested branchId is only honoured if permitted.
    const where = { ...scopeBranchFilter(user, query.branchId), status: query.status };
    const { rows, total } = await this.repo.page(where, query.page, query.pageSize);
    return { items: rows.map(toStockVehicle), page: query.page, pageSize: query.pageSize, total };
  }

  async get(user: SessionUser, id: string): Promise<StockVehicle> {
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundException('Vehicle not found');
    assertBranchAccess(user, row.branchId);
    return toStockVehicle(row);
  }

  create(user: SessionUser, dto: CreateVehicleDto): Promise<StockVehicle> {
    assertBranchAccess(user, dto.branchId, 'BRANCH_MANAGER');
    return this.prisma.$transaction(async (tx) => {
      const variant = await tx.vehicleVariant.findUnique({ where: { id: dto.variantId } });
      if (!variant) throw new NotFoundException('Variant not found');
      const row = await this.repo.create(tx, dto);
      await this.audit.record(tx, {
        actorId: user.id,
        branchId: row.branchId,
        entityType: 'stock_vehicle',
        entityId: row.id,
        action: 'inventory.created',
        changes: { vin: row.vin, askingPricePence: row.askingPricePence },
      });
      return toStockVehicle(row);
    });
  }

  update(user: SessionUser, id: string, dto: UpdateVehicleDto): Promise<StockVehicle> {
    return this.prisma.$transaction(async (tx) => {
      await this.prisma.lockStockVehicle(tx, id);
      const before = await this.repo.findById(id, tx);
      if (!before) throw new NotFoundException('Vehicle not found');
      assertBranchAccess(user, before.branchId, 'BRANCH_MANAGER');

      // Reserved / sold / in-transit vehicles are driven by their own workflows, not by manual status edits.
      if (dto.status && before.status !== 'AVAILABLE' && before.status !== 'WITHDRAWN') {
        throw new ConflictException(`Cannot change status while vehicle is ${before.status}`);
      }
      if (dto.askingPricePence !== undefined && before.status !== 'AVAILABLE' && before.status !== 'WITHDRAWN') {
        // Existing reservations/orders keep their snapshot regardless; this just avoids confusing mid-sale edits.
        throw new ConflictException(`Cannot change price while vehicle is ${before.status}`);
      }

      const row = await this.repo.update(tx, id, dto);
      await this.audit.record(tx, {
        actorId: user.id,
        branchId: row.branchId,
        entityType: 'stock_vehicle',
        entityId: id,
        action: 'inventory.updated',
        changes: {
          from: { askingPricePence: before.askingPricePence, mileage: before.mileage, colour: before.colour, status: before.status },
          to: { askingPricePence: row.askingPricePence, mileage: row.mileage, colour: row.colour, status: row.status },
        },
      });
      return toStockVehicle(row);
    });
  }
}
