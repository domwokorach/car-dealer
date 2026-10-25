import { randomBytes } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import type { SessionUser, VehicleDetail, VehicleSummaryPage } from '@car-dealer/contracts';
import { slugify } from '@car-dealer/utils';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { assertBranchAccess } from '../auth/access-policy';
import { StorageGateway } from '../media/storage.gateway';
import type { ListPublicVehiclesDto } from './dto/list-public-vehicles.dto';
import type { PublishListingDto } from './dto/publish-listing.dto';
import { toVehicleDetail, toVehicleSummary } from './listing.mapper';
import { ListingsRepository, listingInclude } from './listings.repository';

@Injectable()
export class ListingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repo: ListingsRepository,
    private readonly audit: AuditService,
    private readonly storage: StorageGateway,
  ) {}

  async listPublic(q: ListPublicVehiclesDto): Promise<VehicleSummaryPage> {
    const { rows, total } = await this.repo.pagePublished(q);
    return {
      items: rows.map((r) => toVehicleSummary(r, this.storage)),
      page: q.page,
      pageSize: q.pageSize,
      total,
    };
  }

  async getPublic(slug: string): Promise<VehicleDetail> {
    const row = await this.repo.findPublishedBySlug(slug);
    if (!row) throw new NotFoundException('Vehicle not found');
    return toVehicleDetail(row, this.storage);
  }

  async listSaved(user: SessionUser) {
    const saved = await this.prisma.savedListing.findMany({
      where: { profileId: user.id, listing: { status: 'PUBLISHED' } },
      orderBy: { createdAt: 'desc' },
      include: { listing: { include: listingInclude } },
    });
    return saved.map((s) => toVehicleSummary(s.listing, this.storage));
  }

  async save(user: SessionUser, listingId: string) {
    const listing = await this.prisma.listing.findFirst({ where: { id: listingId, status: 'PUBLISHED' }, select: { id: true } });
    if (!listing) throw new NotFoundException('Listing not found');
    await this.prisma.savedListing.upsert({
      where: { profileId_listingId: { profileId: user.id, listingId } },
      update: {},
      create: { profileId: user.id, listingId },
    });
    return { saved: true };
  }

  async unsave(user: SessionUser, listingId: string) {
    await this.prisma.savedListing.deleteMany({ where: { profileId: user.id, listingId } });
    return { saved: false };
  }

  publish(user: SessionUser, dto: PublishListingDto) {
    return this.prisma.$transaction(async (tx) => {
      const vehicle = await tx.stockVehicle.findUnique({ where: { id: dto.stockVehicleId } });
      if (!vehicle) throw new NotFoundException('Vehicle not found');
      assertBranchAccess(user, vehicle.branchId, 'BRANCH_MANAGER');

      const existing = await tx.listing.findUnique({ where: { stockVehicleId: vehicle.id } });
      const listing = existing
        ? await tx.listing.update({
            where: { id: existing.id },
            data: { title: dto.title, description: dto.description, status: 'PUBLISHED', publishedAt: existing.publishedAt ?? new Date() },
            include: listingInclude,
          })
        : await tx.listing.create({
            data: {
              stockVehicleId: vehicle.id,
              title: dto.title,
              description: dto.description,
              slug: `${slugify(dto.title)}-${randomBytes(3).toString('hex')}`,
              status: 'PUBLISHED',
              publishedAt: new Date(),
            },
            include: listingInclude,
          });
      await this.audit.record(tx, {
        actorId: user.id,
        branchId: vehicle.branchId,
        entityType: 'listing',
        entityId: listing.id,
        action: 'listing.published',
        changes: { slug: listing.slug },
      });
      return toVehicleDetail(listing, this.storage);
    });
  }

  archive(user: SessionUser, id: string) {
    return this.prisma.$transaction(async (tx) => {
      const listing = await this.repo.findById(id, tx);
      if (!listing) throw new NotFoundException('Listing not found');
      assertBranchAccess(user, listing.stockVehicle.branchId, 'BRANCH_MANAGER');
      await tx.listing.update({ where: { id }, data: { status: 'ARCHIVED' } });
      await this.audit.record(tx, {
        actorId: user.id,
        branchId: listing.stockVehicle.branchId,
        entityType: 'listing',
        entityId: id,
        action: 'listing.archived',
      });
      return { id, status: 'ARCHIVED' as const };
    });
  }
}
