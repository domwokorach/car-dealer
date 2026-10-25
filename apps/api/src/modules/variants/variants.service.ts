import { Injectable } from '@nestjs/common';
import type { SessionUser, VehicleVariant } from '@car-dealer/contracts';
import type { VehicleVariant as Row } from '@car-dealer/database';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { CreateVariantDto } from './dto/create-variant.dto';

const toVariant = (r: Row): VehicleVariant => ({
  id: r.id,
  modelId: r.modelId,
  name: r.name,
  modelYear: r.modelYear,
  fuelType: r.fuelType,
  transmission: r.transmission,
  engine: r.engine,
  listPricePence: r.listPricePence,
});

@Injectable()
export class VariantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(modelId?: string): Promise<VehicleVariant[]> {
    const rows = await this.prisma.vehicleVariant.findMany({
      where: { modelId },
      orderBy: [{ modelYear: 'desc' }, { name: 'asc' }],
    });
    return rows.map(toVariant);
  }

  create(actor: SessionUser, dto: CreateVariantDto): Promise<VehicleVariant> {
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.vehicleVariant.create({ data: dto });
      await this.audit.record(tx, {
        actorId: actor.id,
        entityType: 'vehicle_variant',
        entityId: row.id,
        action: 'variant.created',
        changes: { name: row.name, modelId: row.modelId },
      });
      return toVariant(row);
    });
  }
}
