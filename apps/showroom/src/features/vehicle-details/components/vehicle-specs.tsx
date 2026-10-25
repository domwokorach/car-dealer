import type { VehicleDetail } from '@car-dealer/contracts';
import { formatMileage } from '@car-dealer/utils';
import { humanise } from '@/lib/format';

export function VehicleSpecs({ vehicle }: { vehicle: VehicleDetail }) {
  const rows: Array<[string, string | null]> = [
    ['Model', `${vehicle.modelName} ${vehicle.variantName}`],
    ['Condition', humanise(vehicle.condition)],
    ['Year', vehicle.registrationYear?.toString() ?? null],
    ['Mileage', vehicle.mileage === null ? null : formatMileage(vehicle.mileage)],
    ['Fuel', humanise(vehicle.fuelType)],
    ['Transmission', humanise(vehicle.transmission)],
    ['Engine', vehicle.engine],
    ['Colour', vehicle.colour],
    ['Available at', `${vehicle.branchName}, ${vehicle.branchCity}`],
  ];
  return (
    <dl className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
      {rows
        .filter((r): r is [string, string] => r[1] !== null)
        .map(([k, v]) => (
          <div key={k} className="flex justify-between border-b border-silver/50 py-3">
            <dt className="text-sm text-slate">{k}</dt>
            <dd className="text-sm font-medium text-ink">{v}</dd>
          </div>
        ))}
    </dl>
  );
}
