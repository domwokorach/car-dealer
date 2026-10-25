import { Injectable } from '@nestjs/common';
import { Prisma } from '@car-dealer/database';
import { Db, PrismaService } from '../../database/prisma.service';
import type { ListPublicVehiclesDto } from './dto/list-public-vehicles.dto';

export const listingInclude = {
  stockVehicle: {
    include: {
      branch: { select: { id: true, name: true, city: true } },
      variant: { include: { model: { select: { name: true, slug: true } } } },
      images: { orderBy: { position: 'asc' } },
    },
  },
} satisfies Prisma.ListingInclude;
export type ListingRow = Prisma.ListingGetPayload<{ include: typeof listingInclude }>;

const VISIBLE_STATUSES = ['AVAILABLE', 'RESERVED', 'IN_TRANSIT'] as const;

@Injectable()
export class ListingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private publicWhere(q: Partial<ListPublicVehiclesDto>): Prisma.ListingWhereInput {
    return {
      status: 'PUBLISHED',
      stockVehicle: {
        status: { in: [...VISIBLE_STATUSES] },
        branch: { isActive: true },
        condition: q.condition,
        branchId: q.branchId,
        askingPricePence: { gte: q.minPricePence, lte: q.maxPricePence },
        variant: { fuelType: q.fuelType, model: q.modelSlug ? { slug: q.modelSlug } : undefined },
      },
    };
  }

  async pagePublished(q: ListPublicVehiclesDto) {
    const where = this.publicWhere(q);
    const orderBy: Prisma.ListingOrderByWithRelationInput =
      q.sort === 'price_asc'
        ? { stockVehicle: { askingPricePence: 'asc' } }
        : q.sort === 'price_desc'
          ? { stockVehicle: { askingPricePence: 'desc' } }
          : { publishedAt: 'desc' };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.listing.findMany({
        where,
        include: listingInclude,
        orderBy,
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      this.prisma.listing.count({ where }),
    ]);
    return { rows, total };
  }

  findPublishedBySlug(slug: string) {
    return this.prisma.listing.findFirst({
      where: { slug, status: 'PUBLISHED', stockVehicle: { status: { in: [...VISIBLE_STATUSES] }, branch: { isActive: true } } },
      include: listingInclude,
    });
  }

  findById(id: string, db: Db = this.prisma) {
    return db.listing.findUnique({ where: { id }, include: { stockVehicle: { select: { branchId: true, status: true } } } });
  }
}
