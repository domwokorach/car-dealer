import type { VehicleSummary } from '@car-dealer/contracts';
import { VehicleCard } from './vehicle-card';

export function VehicleGrid({ vehicles }: { vehicles: VehicleSummary[] }) {
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {vehicles.map((v) => (
        <li key={v.slug}>
          <VehicleCard vehicle={v} />
        </li>
      ))}
    </ul>
  );
}
