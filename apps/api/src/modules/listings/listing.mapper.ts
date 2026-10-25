import type { VehicleDetail, VehicleSummary } from '@car-dealer/contracts';
import type { StorageGateway } from '../media/storage.gateway';
import type { ListingRow } from './listings.repository';

/** Explicit public shape: nothing from the database row leaks unless named here (no VIN, no internal ids besides listing/branch). */
export function toVehicleSummary(row: ListingRow, storage: StorageGateway): VehicleSummary {
  const v = row.stockVehicle;
  const first = v.images[0];
  return {
    listingId: row.id,
    slug: row.slug,
    title: row.title,
    condition: v.condition,
    pricePence: v.askingPricePence,
    mileage: v.mileage,
    registrationYear: v.registrationYear,
    fuelType: v.variant.fuelType,
    transmission: v.variant.transmission,
    colour: v.colour,
    branchName: v.branch.name,
    branchCity: v.branch.city,
    available: v.status === 'AVAILABLE',
    imageUrl: first ? storage.publicUrl(first.storagePath) : null,
  };
}

export function toVehicleDetail(row: ListingRow, storage: StorageGateway): VehicleDetail {
  const v = row.stockVehicle;
  return {
    ...toVehicleSummary(row, storage),
    description: row.description,
    modelName: v.variant.model.name,
    variantName: v.variant.name,
    engine: v.variant.engine,
    branchId: v.branch.id,
    images: v.images.map((i) => ({
      id: i.id,
      url: storage.publicUrl(i.storagePath),
      altText: i.altText,
      position: i.position,
    })),
  };
}
