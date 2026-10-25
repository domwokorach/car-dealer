import { ForbiddenException } from '@nestjs/common';
import type { SessionUser, StaffRole } from '@car-dealer/contracts';

/**
 * Pure authorisation rules. Every branch-scoped action in the API goes through these functions,
 * using a SessionUser that was resolved from the database, not from client input.
 */

export function isAdmin(user: SessionUser): boolean {
  return user.role === 'HEAD_OFFICE_ADMIN' || user.role === 'SUPER_ADMIN';
}

export function isStaff(user: SessionUser): boolean {
  return isAdmin(user) || (user.branchAccess !== 'all' && user.branchAccess.length > 0);
}

const RANK: Record<StaffRole, number> = { SALES_EXECUTIVE: 1, BRANCH_MANAGER: 2 };

export function canAccessBranch(user: SessionUser, branchId: string, minRole: StaffRole = 'SALES_EXECUTIVE'): boolean {
  if (user.branchAccess === 'all') return true;
  return user.branchAccess.some((m) => m.branchId === branchId && RANK[m.role] >= RANK[minRole]);
}

export function assertBranchAccess(user: SessionUser, branchId: string, minRole: StaffRole = 'SALES_EXECUTIVE'): void {
  if (!canAccessBranch(user, branchId, minRole)) {
    throw new ForbiddenException('You do not have access to this branch');
  }
}

export function assertAdmin(user: SessionUser): void {
  if (!isAdmin(user)) throw new ForbiddenException('Head office access required');
}

/** `all` for head office; otherwise the branch ids the user may act on. */
export function accessibleBranchIds(user: SessionUser, minRole: StaffRole = 'SALES_EXECUTIVE'): 'all' | string[] {
  if (user.branchAccess === 'all') return 'all';
  return user.branchAccess.filter((m) => RANK[m.role] >= RANK[minRole]).map((m) => m.branchId);
}

/**
 * Narrow a requested branch filter to what the user may see. Returns a Prisma-ready `branchId` filter,
 * or throws if the user asked for a branch they cannot access.
 */
export function scopeBranchFilter(user: SessionUser, requested?: string): { branchId?: string | { in: string[] } } {
  const allowed = accessibleBranchIds(user);
  if (requested) {
    assertBranchAccess(user, requested);
    return { branchId: requested };
  }
  return allowed === 'all' ? {} : { branchId: { in: allowed } };
}
