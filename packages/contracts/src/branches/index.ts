import { z } from 'zod';
import { UuidSchema } from '../common';


export const BranchSchema = z.object({
  id: UuidSchema,
  code: z.string(),
  name: z.string(),
  addressLine1: z.string(),
  city: z.string(),
  postcode: z.string(),
  phone: z.string().nullable(),
  email: z.string().email().nullable(),
  isActive: z.boolean(),
});
export type Branch = z.infer<typeof BranchSchema>;

export const CreateBranchSchema = z.object({
  code: z.string().min(2).max(16).regex(/^[A-Z0-9-]+$/),
  name: z.string().min(2).max(120),
  addressLine1: z.string().min(2).max(200),
  city: z.string().min(1).max(100),
  postcode: z.string().min(2).max(12),
  phone: z.string().max(32).nullable().default(null),
  email: z.string().email().nullable().default(null),
});
export type CreateBranchInput = z.infer<typeof CreateBranchSchema>;

export const UpdateBranchSchema = CreateBranchSchema.partial().extend({
  isActive: z.boolean().optional(),
});
export type UpdateBranchInput = z.infer<typeof UpdateBranchSchema>;

export const AssignStaffSchema = z.object({
  profileId: UuidSchema,
  branchId: UuidSchema,
  role: z.enum(['SALES_EXECUTIVE', 'BRANCH_MANAGER']),
});
export type AssignStaffInput = z.infer<typeof AssignStaffSchema>;

export const StaffMembershipSchema = z.object({
  id: UuidSchema,
  profileId: UuidSchema,
  branchId: UuidSchema,
  role: z.enum(['SALES_EXECUTIVE', 'BRANCH_MANAGER']),
  isActive: z.boolean(),
  fullName: z.string().nullable(),
  email: z.string().email().nullable(),
});
export type StaffMembership = z.infer<typeof StaffMembershipSchema>;
