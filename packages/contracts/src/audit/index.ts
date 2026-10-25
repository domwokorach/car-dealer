import { z } from 'zod';
import { PaginationQuerySchema, UuidSchema, paginated } from '../common';

export const AuditEventSchema = z.object({
  id: UuidSchema,
  actorId: UuidSchema.nullable(),
  branchId: UuidSchema.nullable(),
  entityType: z.string(),
  entityId: z.string(),
  action: z.string(),
  changes: z.unknown().nullable(),
  createdAt: z.string().datetime(),
});
export type AuditEvent = z.infer<typeof AuditEventSchema>;

export const ListAuditQuerySchema = PaginationQuerySchema.extend({
  entityType: z.string().max(50).optional(),
  entityId: z.string().max(64).optional(),
  branchId: UuidSchema.optional(),
});
export type ListAuditQuery = z.infer<typeof ListAuditQuerySchema>;
export const AuditEventPageSchema = paginated(AuditEventSchema);
