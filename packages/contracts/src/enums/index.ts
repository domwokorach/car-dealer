import { z } from 'zod';

/** Enum values mirror packages/database/prisma/schema.prisma. Keep in sync (see enums.test.ts). */
export const ROLES = [
  'CUSTOMER',
  'SALES_EXECUTIVE',
  'BRANCH_MANAGER',
  'HEAD_OFFICE_ADMIN',
  'SUPER_ADMIN',
] as const;
export const RoleSchema = z.enum(ROLES);
export type Role = z.infer<typeof RoleSchema>;

export const STAFF_ROLES = ['SALES_EXECUTIVE', 'BRANCH_MANAGER'] as const;
export const StaffRoleSchema = z.enum(STAFF_ROLES);
export type StaffRole = z.infer<typeof StaffRoleSchema>;

export const VEHICLE_CONDITIONS = ['NEW', 'USED'] as const;
export const VehicleConditionSchema = z.enum(VEHICLE_CONDITIONS);
export type VehicleCondition = z.infer<typeof VehicleConditionSchema>;

export const STOCK_STATUSES = ['AVAILABLE', 'RESERVED', 'SOLD', 'IN_TRANSIT', 'WITHDRAWN'] as const;
export const StockStatusSchema = z.enum(STOCK_STATUSES);
export type StockStatus = z.infer<typeof StockStatusSchema>;

export const LISTING_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
export const ListingStatusSchema = z.enum(LISTING_STATUSES);
export type ListingStatus = z.infer<typeof ListingStatusSchema>;

export const RESERVATION_STATUSES = ['ACTIVE', 'EXPIRED', 'CANCELLED', 'CONVERTED'] as const;
export const ReservationStatusSchema = z.enum(RESERVATION_STATUSES);
export type ReservationStatus = z.infer<typeof ReservationStatusSchema>;

export const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as const;
export const OrderStatusSchema = z.enum(ORDER_STATUSES);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const TRANSFER_STATUSES = ['REQUESTED', 'COMPLETED', 'CANCELLED'] as const;
export const TransferStatusSchema = z.enum(TRANSFER_STATUSES);
export type TransferStatus = z.infer<typeof TransferStatusSchema>;

export const ENQUIRY_STATUSES = ['NEW', 'IN_PROGRESS', 'CLOSED'] as const;
export const EnquiryStatusSchema = z.enum(ENQUIRY_STATUSES);
export type EnquiryStatus = z.infer<typeof EnquiryStatusSchema>;

export const TEST_DRIVE_STATUSES = ['REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as const;
export const TestDriveStatusSchema = z.enum(TEST_DRIVE_STATUSES);
export type TestDriveStatus = z.infer<typeof TestDriveStatusSchema>;

export const FUEL_TYPES = ['PETROL', 'DIESEL', 'HYBRID', 'PLUG_IN_HYBRID', 'ELECTRIC'] as const;
export const FuelTypeSchema = z.enum(FUEL_TYPES);
export type FuelType = z.infer<typeof FuelTypeSchema>;

export const TRANSMISSIONS = ['MANUAL', 'AUTOMATIC'] as const;
export const TransmissionSchema = z.enum(TRANSMISSIONS);
export type Transmission = z.infer<typeof TransmissionSchema>;
