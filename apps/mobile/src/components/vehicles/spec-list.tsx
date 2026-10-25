import type { VehicleDetail } from '@car-dealer/contracts';
import { formatMileage } from '@car-dealer/utils';
import { View } from 'react-native';
import { Text } from '@/components/ui';
import { humanise } from '@/utils/format';

export function SpecList({ vehicle }: { vehicle: VehicleDetail }) {
  const rows: [string, string | null][] = [
    ['Model', `${vehicle.modelName} ${vehicle.variantName}`],
    ['Condition', humanise(vehicle.condition)],
    ['Year', vehicle.registrationYear?.toString() ?? null],
    ['Mileage', vehicle.mileage === null ? null : formatMileage(vehicle.mileage)],
    ['Fuel', humanise(vehicle.fuelType)],
    ['Transmission', humanise(vehicle.transmission)],
    ['Engine', vehicle.engine],
    ['Colour', vehicle.colour],
    ['Availability', vehicle.available ? 'Available now' : 'Reserved'],
  ];
  return (
    <View>
      {rows
        .filter((r): r is [string, string] => r[1] !== null)
        .map(([label, value]) => (
          <View key={label} className="flex-row justify-between border-b border-border py-3">
            <Text tone="muted">{label}</Text>
            <Text style={{ fontWeight: '500', flexShrink: 1, textAlign: 'right' }}>{value}</Text>
          </View>
        ))}
    </View>
  );
}
