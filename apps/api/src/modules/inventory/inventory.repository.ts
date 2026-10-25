import { Injectable } from '@nestjs/common';
import { Prisma } from '@car-dealer/database';
import type { StockVehicle } from '@car-dealer/contracts';
import { Db, PrismaService } from '../../database/prisma.service';
import type { CreateVehicleDto } from './dto/create-vehicle.dto';

const include = {
  listing: { select: { status: true, slug: true } },
  variant: { select: { name: true, model: { select: { name: true } } } },
} satisfies Prisma.StockVehicleInclude;
type Row = Prisma.StockVehicleGetPayload<{ include: typeof include }>;

export function toStockVehicle(r: Row): StockVehicle {
  return {
    id: r.id,
    vin: r.vin,
    branchId: r.branchId,
    variantId: r.variantId,
    modelName: r.variant.model.name,
    variantName: r.variant.name,
    condition: r.condition,
    status: r.status,
    askingPricePence: r.askingPricePence,
    mileage: r.mileage,
    registrationYear: r.registrationYear,
    colour: r.colour,
    listingStatus: r.listing?.status ?? null,
    listingSlug: r.listing?.slug ?? null,
    createdAt: r.createdAt.toISOString(),
  };
}

@Injectable()
export class InventoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async page(where: Prisma.StockVehicleWhereInput, page: number, pageSize: number) {
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.stockVehicle.findMany({
        where,
        include,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.stockVehicle.count({ where }),
    ]);
    return { rows, total };
  }

  findById(id: string, db: Db = this.prisma) {
    return db.stockVehicle.findUnique({ where: { id }, include });
  }

  create(db: Db, data: CreateVehicleDto) {
    return db.stockVehicle.create({ data, include });
  }

  update(db: Db, id: string, data: Prisma.StockVehicleUpdateInput) {
    return db.stockVehicle.update({ where: { id }, data, include });
  }
}
