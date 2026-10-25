import type { VehicleSummary } from '@car-dealer/contracts';
import { formatMileage, formatPence } from '@car-dealer/utils';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import { Skeleton } from '@/components/panel/skeleton';
import { Badge, Text } from '@/components/ui';
import { spacing } from '@/theme';
import { humanise } from '@/utils/format';

export function VehicleCard({ vehicle, onPress, width }: { vehicle: VehicleSummary; onPress: () => void; width?: number }) {
  const meta = [vehicle.registrationYear, vehicle.mileage === null ? null : formatMileage(vehicle.mileage), humanise(vehicle.fuelType)]
    .filter(Boolean)
    .join(' · ');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${vehicle.title}, ${formatPence(vehicle.pricePence)}`}
      onPress={onPress}
      className="overflow-hidden rounded-xl border border-border bg-card active:opacity-85"
      style={width ? { width } : undefined}
    >
      <View className="bg-surface" style={{ aspectRatio: 16 / 10 }}>
        {vehicle.imageUrl ? (
          <Image source={{ uri: vehicle.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text variant="label" tone="muted">
              Photos coming soon
            </Text>
          </View>
        )}
      </View>
      <View style={{ padding: spacing.lg, gap: spacing.xs + 2 }}>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Badge label={humanise(vehicle.condition)} tone={vehicle.condition === 'NEW' ? 'accent' : 'neutral'} />
          {!vehicle.available ? <Badge label="Reserved" tone="warning" /> : null}
        </View>
        <Text variant="heading" numberOfLines={1}>
          {vehicle.title}
        </Text>
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {meta}
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Text variant="price">{formatPence(vehicle.pricePence)}</Text>
          <Text variant="caption" tone="muted">
            {vehicle.branchCity}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

/** Loading placeholder with the same footprint as {@link VehicleCard}. */
export function VehicleCardSkeleton({ width }: { width?: number }) {
  return (
    <View className="overflow-hidden rounded-xl border border-border bg-card" style={width ? { width } : undefined}>
      <Skeleton className="w-full rounded-none" style={{ aspectRatio: 16 / 10 }} />
      <View style={{ padding: spacing.lg, gap: spacing.sm }}>
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-6 w-1/3" />
      </View>
    </View>
  );
}
