import { Injectable } from '@nestjs/common';
import type { SessionUser, VehicleModel } from '@car-dealer/contracts';
import { slugify } from '@car-dealer/utils';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { CreateModelDto } from './dto/create-model.dto';

@Injectable()
export class ModelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(): Promise<VehicleModel[]> {
    const rows = await this.prisma.vehicleModel.findMany({ orderBy: { name: 'asc' } });
    return rows.map(({ id, slug, name, bodyType, description }) => ({ id, slug, name, bodyType, description }));
  }

  create(actor: SessionUser, dto: CreateModelDto): Promise<VehicleModel> {
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.vehicleModel.create({ data: { ...dto, slug: slugify(dto.name) } });
      await this.audit.record(tx, {
        actorId: actor.id,
        entityType: 'vehicle_model',
        entityId: row.id,
        action: 'model.created',
        changes: { name: row.name },
      });
      return { id: row.id, slug: row.slug, name: row.name, bodyType: row.bodyType, description: row.description };
    });
  }
}
