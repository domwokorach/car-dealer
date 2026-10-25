import type { SessionUser } from '@car-dealer/contracts';
import { accessibleBranchIds, assertBranchAccess, canAccessBranch, isAdmin, isStaff, scopeBranchFilter } from './access-policy';

const A = '00000000-0000-0000-0000-00000000000a';
const B = '00000000-0000-0000-0000-00000000000b';

const user = (over: Partial<SessionUser>): SessionUser => ({
  id: '00000000-0000-0000-0000-000000000001',
  email: null,
  fullName: null,
  role: 'CUSTOMER',
  branchAccess: [],
  ...over,
});

describe('access policy', () => {
  const sales = user({ branchAccess: [{ branchId: A, role: 'SALES_EXECUTIVE' }] });
  const manager = user({ branchAccess: [{ branchId: A, role: 'BRANCH_MANAGER' }] });
  const head = user({ role: 'HEAD_OFFICE_ADMIN', branchAccess: 'all' });

  it('lets branch staff act only on their own branch', () => {
    expect(canAccessBranch(sales, A)).toBe(true);
    expect(canAccessBranch(sales, B)).toBe(false);
    expect(() => assertBranchAccess(sales, B)).toThrow('branch');
  });

  it('enforces the minimum branch role', () => {
    expect(canAccessBranch(sales, A, 'BRANCH_MANAGER')).toBe(false);
    expect(canAccessBranch(manager, A, 'BRANCH_MANAGER')).toBe(true);
  });

  it('gives head office every branch', () => {
    expect(canAccessBranch(head, B, 'BRANCH_MANAGER')).toBe(true);
    expect(accessibleBranchIds(head)).toBe('all');
    expect(isAdmin(head)).toBe(true);
  });

  it('treats customers as non-staff with no branch access', () => {
    const c = user({});
    expect(isStaff(c)).toBe(false);
    expect(canAccessBranch(c, A)).toBe(false);
    expect(accessibleBranchIds(c)).toEqual([]);
  });

  it('rejects a client-requested branch outside the user scope, and narrows defaults', () => {
    expect(() => scopeBranchFilter(sales, B)).toThrow();
    expect(scopeBranchFilter(sales)).toEqual({ branchId: { in: [A] } });
    expect(scopeBranchFilter(head)).toEqual({});
  });
});
