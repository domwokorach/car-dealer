import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { SessionUser, StaffMembership } from '@car-dealer/contracts';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { accessibleBranchIds, assertBranchAccess } from '../auth/access-policy';
import type { AssignStaffDto } from './dto/assign-staff.dto';
import type { SetGlobalRoleDto } from './dto/set-global-role.dto';

const include = { profile: { select: { fullName: true, email: true } } } as const;

type Row = {
  id: string;
  profileId: string;
  branchId: string;
  role: 'SALES_EXECUTIVE' | 'BRANCH_MANAGER';
  isActive: boolean;
  profile: { fullName: string | null; email: string | null };
};

const toMembership = (r: Row): StaffMembership => ({
  id: r.id,
  profileId: r.profileId,
  branchId: r.branchId,
  role: r.role,
  isActive: r.isActive,
  fullName: r.profile.fullName,
  email: r.profile.email,
});

@Injectable()
export class StaffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Managers see their own branches' staff; head office sees all; sales executives see none. */
  async list(user: SessionUser, branchId?: string): Promise<StaffMembership[]> {
    let where: { branchId?: string | { in: string[] } };
    if (branchId) {
      assertBranchAccess(user, branchId, 'BRANCH_MANAGER');
      where = { branchId };
    } else {
      const ids = accessibleBranchIds(user, 'BRANCH_MANAGER');
      if (ids !== 'all' && ids.length === 0) return [];
      where = ids === 'all' ? {} : { branchId: { in: ids } };
    }
    const rows = await this.prisma.staffMembership.findMany({ where, include, orderBy: { createdAt: 'asc' } });
    return rows.map(toMembership);
  }

  assign(actor: SessionUser, dto: AssignStaffDto): Promise<StaffMembership> {
    return this.prisma.$transaction(async (tx) => {
      const [profile, branch] = await Promise.all([
        tx.profile.findUnique({ where: { id: dto.profileId } }),
        tx.branch.findUnique({ where: { id: dto.branchId } }),
      ]);
      if (!profile) throw new NotFoundException('Profile not found (the person must sign in once first)');
      if (!branch) throw new NotFoundException('Branch not found');

      const row = await tx.staffMembership.upsert({
        where: { profileId_branchId: { profileId: dto.profileId, branchId: dto.branchId } },
        update: { role: dto.role, isActive: true },
        create: dto,
        include,
      });
      await this.audit.record(tx, {
        actorId: actor.id,
        branchId: dto.branchId,
        entityType: 'staff_membership',
        entityId: row.id,
        action: 'staff.assigned',
        changes: { profileId: dto.profileId, role: dto.role },
      });
      return toMembership(row);
    });
  }

  deactivate(actor: SessionUser, membershipId: string): Promise<StaffMembership> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.staffMembership.findUnique({ where: { id: membershipId } });
      if (!existing) throw new NotFoundException('Membership not found');
      const row = await tx.staffMembership.update({ where: { id: membershipId }, data: { isActive: false }, include });
      await this.audit.record(tx, {
        actorId: actor.id,
        branchId: existing.branchId,
        entityType: 'staff_membership',
        entityId: membershipId,
        action: 'staff.deactivated',
      });
      return toMembership(row);
    });
  }

  /** Global roles are the most sensitive grant: super admins only, and never on yourself. */
  setGlobalRole(actor: SessionUser, profileId: string, dto: SetGlobalRoleDto) {
    if (actor.id === profileId) throw new ForbiddenException('You cannot change your own role');
    return this.prisma.$transaction(async (tx) => {
      const before = await tx.profile.findUnique({ where: { id: profileId } });
      if (!before) throw new NotFoundException('Profile not found');
      const after = await tx.profile.update({ where: { id: profileId }, data: { role: dto.role } });
      await this.audit.record(tx, {
        actorId: actor.id,
        entityType: 'profile',
        entityId: profileId,
        action: 'profile.role_changed',
        changes: { from: before.role, to: after.role },
      });
      return { id: after.id, role: after.role };
    });
  }
}
