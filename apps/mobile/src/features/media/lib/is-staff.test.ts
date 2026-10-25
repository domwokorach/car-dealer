import { describe, expect, it } from 'vitest';
import { isStaffUser } from './is-staff';

describe('isStaffUser', () => {
  it('recognises admins and branch staff, not customers', () => {
    expect(isStaffUser({ role: 'SUPER_ADMIN', branchAccess: 'all' })).toBe(true);
    expect(isStaffUser({ role: 'SALES_EXECUTIVE', branchAccess: [{ branchId: 'b', role: 'SALES_EXECUTIVE' }] })).toBe(true);
    expect(isStaffUser({ role: 'CUSTOMER', branchAccess: [] })).toBe(false);
    expect(isStaffUser(undefined)).toBe(false);
  });
});
