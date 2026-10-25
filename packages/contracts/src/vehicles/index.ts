import { z } from 'zod';
import { PaginationQuerySchema, PenceSchema, UuidSchema, paginated } from '../common';
import {
  FuelTypeSchema,
  ListingStatusSchema,
  StockStatusSchema,
  TransmissionSchema,
  VehicleConditionSchema,
} from '../enums';

export const VehicleModelSchema = z.object({
  id: UuidSchema,
  slug: z.string(),
  name: z.string(),
  bodyType: z.string(),
  description: z.string().nullable(),
});
export type VehicleModel = z.infer<typeof VehicleModelSchema>;

export const CreateVehicleModelSchema = z.object({
  name: z.string().min(1).max(100),
  bodyType: z.string().min(1).max(50),
  description: z.string().max(2000).nullable().default(null),
});
export type CreateVehicleModelInput = z.infer<typeof CreateVehicleModelSchema>;

export const VehicleVariantSchema = z.object({
  id: UuidSchema,
  modelId: UuidSchema,
  name: z.string(),
  modelYear: z.number().int(),
  fuelType: FuelTypeSchema,
  transmission: TransmissionSchema,
  engine: z.string().nullable(),
  listPricePence: PenceSchema,
});
export type VehicleVariant = z.infer<typeof VehicleVariantSchema>;

export const CreateVehicleVariantSchema = z.object({
  modelId: UuidSchema,
  name: z.string().min(1).max(100),
  modelYear: z.number().int().min(1990).max(2100),
  fuelType: FuelTypeSchema,
  transmission: TransmissionSchema,
  engine: z.string().max(100).nullable().default(null),
  listPricePence: PenceSchema,
});
export type CreateVehicleVariantInput = z.infer<typeof CreateVehicleVariantSchema>;

export const VehicleImageSchema = z.object({
  id: UuidSchema,
  url: z.string().url(),
  altText: z.string().nullable(),
  position: z.number().int(),
});
export type VehicleImage = z.infer<typeof VehicleImageSchema>;

/** Public listing card. */
export const VehicleSummarySchema = z.object({
  listingId: UuidSchema,
  slug: z.string(),
  title: z.string(),
  condition: VehicleConditionSchema,
  pricePence: PenceSchema,
  mileage: z.number().int().nullable(),
  registrationYear: z.number().int().nullable(),
  fuelType: FuelTypeSchema,
  transmission: TransmissionSchema,
  colour: z.string().nullable(),
  branchName: z.string(),
  branchCity: z.string(),
  available: z.boolean(),
  imageUrl: z.string().url().nullable(),
});
export type VehicleSummary = z.infer<typeof VehicleSummarySchema>;

export const VehicleDetailSchema = VehicleSummarySchema.extend({
  description: z.string().nullable(),
  modelName: z.string(),
  variantName: z.string(),
  engine: z.string().nullable(),
  branchId: UuidSchema,
  images: z.array(VehicleImageSchema),
});
export type VehicleDetail = z.infer<typeof VehicleDetailSchema>;

export const ListVehiclesQuerySchema = PaginationQuerySchema.extend({
  condition: VehicleConditionSchema.optional(),
  modelSlug: z.string().max(100).optional(),
  branchId: UuidSchema.optional(),
  fuelType: FuelTypeSchema.optional(),
  minPricePence: z.coerce.number().int().min(0).optional(),
  maxPricePence: z.coerce.number().int().min(0).optional(),
  sort: z.enum(['price_asc', 'price_desc', 'newest']).default('newest'),
});
export type ListVehiclesQuery = z.infer<typeof ListVehiclesQuerySchema>;

export const VehicleSummaryPageSchema = paginated(VehicleSummarySchema);
export type VehicleSummaryPage = z.infer<typeof VehicleSummaryPageSchema>;

/** Staff view of one physical vehicle. */
export const StockVehicleSchema = z.object({
  id: UuidSchema,
  vin: z.string().nullable(),
  branchId: UuidSchema,
  variantId: UuidSchema,
  modelName: z.string(),
  variantName: z.string(),
  condition: VehicleConditionSchema,
  status: StockStatusSchema,
  askingPricePence: PenceSchema,
  mileage: z.number().int().nullable(),
  registrationYear: z.number().int().nullable(),
  colour: z.string().nullable(),
  listingStatus: ListingStatusSchema.nullable(),
  listingSlug: z.string().nullable(),
  createdAt: z.string().datetime(),
});
export type StockVehicle = z.infer<typeof StockVehicleSchema>;

const VinSchema = z
  .string()
  .length(17)
  .regex(/^[A-HJ-NPR-Z0-9]{17}$/, 'VIN must be 17 characters and exclude I, O and Q');

export const CreateStockVehicleSchema = z.object({
  vin: VinSchema.nullable().default(null),
  branchId: UuidSchema,
  variantId: UuidSchema,
  condition: VehicleConditionSchema,
  askingPricePence: PenceSchema,
  mileage: z.number().int().min(0).max(1_000_000).nullable().default(null),
  registrationYear: z.number().int().min(1990).max(2100).nullable().default(null),
  colour: z.string().max(50).nullable().default(null),
});
export type CreateStockVehicleInput = z.infer<typeof CreateStockVehicleSchema>;

export const UpdateStockVehicleSchema = z.object({
  askingPricePence: PenceSchema.optional(),
  mileage: z.number().int().min(0).max(1_000_000).nullable().optional(),
  colour: z.string().max(50).nullable().optional(),
  status: z.enum(['AVAILABLE', 'WITHDRAWN']).optional(),
});
export type UpdateStockVehicleInput = z.infer<typeof UpdateStockVehicleSchema>;

export const ListStockQuerySchema = PaginationQuerySchema.extend({
  branchId: UuidSchema.optional(),
  status: StockStatusSchema.optional(),
});
export type ListStockQuery = z.infer<typeof ListStockQuerySchema>;
export const StockVehiclePageSchema = paginated(StockVehicleSchema);

export const PublishListingSchema = z.object({
  stockVehicleId: UuidSchema,
  title: z.string().min(3).max(160),
  description: z.string().max(5000).nullable().default(null),
});
export type PublishListingInput = z.infer<typeof PublishListingSchema>;

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export const RequestImageUploadSchema = z.object({
  stockVehicleId: UuidSchema,
  contentType: z.enum(ALLOWED_IMAGE_TYPES),
  sizeBytes: z.number().int().min(1).max(MAX_IMAGE_BYTES),
});
export type RequestImageUploadInput = z.infer<typeof RequestImageUploadSchema>;

export const ImageUploadTargetSchema = z.object({
  uploadUrl: z.string().url(),
  token: z.string(),
  storagePath: z.string(),
});
export type ImageUploadTarget = z.infer<typeof ImageUploadTargetSchema>;

export const ConfirmImageUploadSchema = z.object({
  stockVehicleId: UuidSchema,
  storagePath: z.string().min(1).max(300),
  altText: z.string().max(200).nullable().default(null),
});
export type ConfirmImageUploadInput = z.infer<typeof ConfirmImageUploadSchema>;
