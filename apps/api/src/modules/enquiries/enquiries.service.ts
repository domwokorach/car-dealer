import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Enquiry, SessionUser } from '@car-dealer/contracts';
import type { Enquiry as Row } from '@car-dealer/database';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { assertBranchAccess, scopeBranchFilter } from '../auth/access-policy';
import { OutboxService } from '../notifications/outbox.service';
import type { CreateEnquiryDto } from './dto/create-enquiry.dto';
import type { UpdateEnquiryStatusDto } from './dto/update-enquiry-status.dto';

const toEnquiry = (r: Row): Enquiry => ({
  id: r.id,
  branchId: r.branchId,
  name: r.name,
  email: r.email,
  phone: r.phone,
  message: r.message,
  status: r.status,
  createdAt: r.createdAt.toISOString(),
});

@Injectable()
export class EnquiriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly outbox: OutboxService,
  ) {}

  /** Anonymous or signed-in. The owning branch is derived server-side from the listing when given. */
  create(user: SessionUser | undefined, dto: CreateEnquiryDto): Promise<{ id: string }> {
    return this.prisma.$transaction(async (tx) => {
      let branchId = dto.branchId;
      if (dto.listingId) {
        const listing = await tx.listing.findFirst({
          where: { id: dto.listingId, status: 'PUBLISHED' },
          select: { stockVehicle: { select: { branchId: true } } },
        });
        if (!listing) throw new NotFoundException('Listing not found');
        branchId = listing.stockVehicle.branchId;
      }
      const branch = branchId ? await tx.branch.findFirst({ where: { id: branchId, isActive: true } }) : null;
      if (!branch) throw new BadRequestException('Unknown branch');

      const row = await tx.enquiry.create({
        data: {
          branchId: branch.id,
          listingId: dto.listingId,
          profileId: user?.id,
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
          message: dto.message,
        },
      });
      await this.outbox.enqueue(tx, 'enquiry.created', { enquiryId: row.id, branchId: branch.id });
      return { id: row.id };
    });
  }

  async list(user: SessionUser, branchId?: string): Promise<Enquiry[]> {
    const rows = await this.prisma.enquiry.findMany({
      where: scopeBranchFilter(user, branchId),
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return rows.map(toEnquiry);
  }

  updateStatus(user: SessionUser, id: string, dto: UpdateEnquiryStatusDto): Promise<Enquiry> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.enquiry.findUnique({ where: { id } });
      if (!existing) throw new NotFoundException('Enquiry not found');
      assertBranchAccess(user, existing.branchId);
      const row = await tx.enquiry.update({ where: { id }, data: { status: dto.status } });
      await this.audit.record(tx, {
        actorId: user.id,
        branchId: existing.branchId,
        entityType: 'enquiry',
        entityId: id,
        action: 'enquiry.status_changed',
        changes: { from: existing.status, to: dto.status },
      });
      return toEnquiry(row);
    });
  }
}
