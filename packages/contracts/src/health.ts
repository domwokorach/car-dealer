import { z } from 'zod';

export const HealthSchema = z.object({
  status: z.literal('ok'),
  database: z.enum(['up', 'down']),
  uptimeSeconds: z.number(),
});
export type Health = z.infer<typeof HealthSchema>;
