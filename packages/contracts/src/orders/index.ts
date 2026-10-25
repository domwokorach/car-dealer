import { z } from 'zod';
import { PenceSchema, UuidSchema } from '../common';
import { OrderStatusSchema, TransferStatusSchema } from '../enums';

export const CreateOrderSchema = z.object({
  reservationId: UuidSchema,
});
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

export const OrderSchema = z.object({
  id: UuidSchema,
  stockVehicleId: UuidSchema,
  branchId: UuidSchema,
  profileId: UuidSchema,
  status: OrderStatusSchema,
  agreedPricePence: PenceSchema,
  createdAt: z.string().datetime(),
});
export type Order = z.infer<typeof OrderSchema>;

export const UpdateOrderStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'COMPLETED', 'CANCELLED']),
});
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;

export const CreateTransferSchema = z.object({
  stockVehicleId: UuidSchema,
  toBranchId: UuidSchema,
  reason: z.string().max(500).nullable().default(null),
});
export type CreateTransferInput = z.infer<typeof CreateTransferSchema>;

export const TransferSchema = z.object({
  id: UuidSchema,
  stockVehicleId: UuidSchema,
  fromBranchId: UuidSchema,
  toBranchId: UuidSchema,
  status: TransferStatusSchema,
  reason: z.string().nullable(),
  createdAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
});
export type Transfer = z.infer<typeof TransferSchema>;
