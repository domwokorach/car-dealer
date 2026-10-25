import { z } from 'zod';

export const SetGlobalRoleDto = z.object({
  role: z.enum(['CUSTOMER', 'HEAD_OFFICE_ADMIN', 'SUPER_ADMIN']),
});
export type SetGlobalRoleDto = z.infer<typeof SetGlobalRoleDto>;
