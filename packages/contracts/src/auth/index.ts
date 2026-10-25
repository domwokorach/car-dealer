import { z } from 'zod';
import { RoleSchema, StaffRoleSchema } from '../enums';

export const BranchMembershipSchema = z.object({
  branchId: z.string().uuid(),
  role: StaffRoleSchema,
});

/** Resolved server-side from the database. Never derived from client-supplied claims. */
export const SessionUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().nullable(),
  fullName: z.string().nullable(),
  role: RoleSchema,
  /** `all` for head office / super admin; otherwise the branches the user may act on. */
  branchAccess: z.union([z.literal('all'), z.array(BranchMembershipSchema)]),
});
export type SessionUser = z.infer<typeof SessionUserSchema>;
