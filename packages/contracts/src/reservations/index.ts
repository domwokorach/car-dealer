import { z } from 'zod';
import { PenceSchema, UuidSchema } from '../common';
import { ReservationStatusSchema } from '../enums';

export const CreateReservationSchema = z.object({
  listingId: UuidSchema,
  /** Client-generated; makes retries safe. */
  idempotencyKey: z.string().uuid(),
});
export type CreateReservationInput = z.infer<typeof CreateReservationSchema>;

export const ReservationSchema = z.object({
  id: UuidSchema,
  stockVehicleId: UuidSchema,
  branchId: UuidSchema,
  status: ReservationStatusSchema,
  /** Price agreed at the moment of reservation. Later price changes never alter it. */
  pricePence: PenceSchema,
  expiresAt: z.string().datetime(),
  createdAt: z.string().datetime(),
});
export type Reservation = z.infer<typeof ReservationSchema>;

export const EnquiryCreateSchema = z
  .object({
    /** Either a listing (branch is derived from the vehicle) or an explicit branch is required. */
    listingId: UuidSchema.optional(),
    branchId: UuidSchema.optional(),
    name: z.string().min(1).max(120),
    email: z.string().email(),
    phone: z.string().max(32).nullable().default(null),
    message: z.string().min(1).max(2000),
  })
  .refine((v) => v.listingId || v.branchId, { message: 'Provide a listingId or branchId', path: ['listingId'] });
export type EnquiryCreateInput = z.infer<typeof EnquiryCreateSchema>;

export const EnquirySchema = z.object({
  id: UuidSchema,
  branchId: UuidSchema,
  name: z.string(),
  email: z.string().email(),
  phone: z.string().nullable(),
  message: z.string(),
  status: z.enum(['NEW', 'IN_PROGRESS', 'CLOSED']),
  createdAt: z.string().datetime(),
});
export type Enquiry = z.infer<typeof EnquirySchema>;

export const TestDriveCreateSchema = z.object({
  listingId: UuidSchema,
  scheduledAt: z.string().datetime(),
  notes: z.string().max(1000).nullable().default(null),
});
export type TestDriveCreateInput = z.infer<typeof TestDriveCreateSchema>;

export const TestDriveSchema = z.object({
  id: UuidSchema,
  stockVehicleId: UuidSchema,
  branchId: UuidSchema,
  scheduledAt: z.string().datetime(),
  status: z.enum(['REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED']),
});
export type TestDrive = z.infer<typeof TestDriveSchema>;

export const UpdateEnquiryStatusSchema = z.object({ status: z.enum(['NEW', 'IN_PROGRESS', 'CLOSED']) });
export type UpdateEnquiryStatusInput = z.infer<typeof UpdateEnquiryStatusSchema>;

export const UpdateTestDriveStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'COMPLETED', 'CANCELLED']),
});
export type UpdateTestDriveStatusInput = z.infer<typeof UpdateTestDriveStatusSchema>;
