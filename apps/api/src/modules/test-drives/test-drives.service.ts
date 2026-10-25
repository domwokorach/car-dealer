import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { SessionUser, TestDrive } from '@car-dealer/contracts';
import type { TestDrive as Row } from '@car-dealer/database';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { assertBranchAccess, scopeBranchFilter } from '../auth/access-policy';
import { OutboxService } from '../notifications/outbox.service';
import type { CreateTestDriveDto } from './dto/create-test-drive.dto';
import type { UpdateTestDriveStatusDto } from './dto/update-test-drive-status.dto';

const toTestDrive = (r: Row): TestDrive => ({
  id: r.id,
  stockVehicleId: r.stockVehicleId,
  branchId: r.branchId,
  scheduledAt: r.scheduledAt.toISOString(),
  status: r.status,
});

@Injectable()
export class TestDrivesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly outbox: OutboxService,
  ) {}

  create(user: SessionUser, dto: CreateTestDriveDto): Promise<TestDrive> {
    const scheduledAt = new Date(dto.scheduledAt);
    if (scheduledAt.getTime() <= Date.now()) throw new BadRequestException('Choose a time in the future');

    return this.prisma.$transaction(async (tx) => {
      const listing = await tx.listing.findFirst({
        where: { id: dto.listingId, status: 'PUBLISHED' },
        include: { stockVehicle: true },
      });
      if (!listing) throw new NotFoundException('Listing not found');
      const vehicle = listing.stockVehicle;
      if (vehicle.status === 'SOLD' || vehicle.status === 'WITHDRAWN') {
        throw new ConflictException('This vehicle is no longer available');
      }
      const row = await tx.testDrive.create({
        data: {
          branchId: vehicle.branchId,
          stockVehicleId: vehicle.id,
          profileId: user.id,
          scheduledAt,
          notes: dto.notes,
        },
      });
      await this.outbox.enqueue(tx, 'test_drive.requested', { testDriveId: row.id, branchId: row.branchId });
      return toTestDrive(row);
    });
  }

  async mine(user: SessionUser): Promise<TestDrive[]> {
    const rows = await this.prisma.testDrive.findMany({ where: { profileId: user.id }, orderBy: { scheduledAt: 'desc' } });
    return rows.map(toTestDrive);
  }

  async list(user: SessionUser): Promise<TestDrive[]> {
    const rows = await this.prisma.testDrive.findMany({
      where: scopeBranchFilter(user),
      orderBy: { scheduledAt: 'asc' },
      take: 200,
    });
    return rows.map(toTestDrive);
  }

  updateStatus(user: SessionUser, id: string, dto: UpdateTestDriveStatusDto): Promise<TestDrive> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.testDrive.findUnique({ where: { id } });
      if (!existing) throw new NotFoundException('Test drive not found');
      assertBranchAccess(user, existing.branchId);
      const row = await tx.testDrive.update({ where: { id }, data: { status: dto.status } });
      await this.audit.record(tx, {
        actorId: user.id,
        branchId: existing.branchId,
        entityType: 'test_drive',
        entityId: id,
        action: 'test_drive.status_changed',
        changes: { from: existing.status, to: dto.status },
      });
      return toTestDrive(row);
    });
  }
}
