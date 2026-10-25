import type { VehicleSummary } from '@car-dealer/contracts';
import { formatPence } from '@car-dealer/utils';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';
import { Carousel } from '@/components/panel/carousel';
import { Badge, Text } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { humanise } from '@/utils/format';

/**
 * One featured vehicle: a full-bleed photo, a scrim that keeps text readable on any photo, and a caption that is
 * only visible while this slide is the active one. Selecting the caption opens the vehicle.
 */
export function HeroSlide({
  vehicle,
  priority,
  onSelect,
  onImageError,
}: {
  vehicle: VehicleSummary;
  priority: boolean;
  onSelect: () => void;
  onImageError: (url: string) => void;
}) {
  const url = vehicle.imageUrl as string;
  return (
    <View style={StyleSheet.absoluteFill}>
      <Image
        source={{ uri: url }}
        accessibilityIgnoresInvertColors
        accessibilityLabel={vehicle.title}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={400}
        cachePolicy="memory-disk"
        recyclingKey={vehicle.slug}
        priority={priority ? 'high' : 'normal'}
        onError={() => onImageError(url)}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(10,11,13,0.25)', 'rgba(10,11,13,0.1)', 'rgba(10,11,13,0.88)']}
        locations={[0, 0.35, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Carousel.Caption style={{ position: 'absolute', left: spacing.xl, right: spacing.xl, bottom: 52 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${vehicle.title}, ${formatPence(vehicle.pricePence)}. View details`}
          onPress={onSelect}
          className="active:opacity-80"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: spacing.md,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.lg,
            borderRadius: 14,
            backgroundColor: 'rgba(10,11,13,0.55)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.16)',
          }}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="heading" tone="inverse" numberOfLines={1}>
              {vehicle.modelName}
            </Text>
            <Text variant="caption" style={{ color: colors.silver }} numberOfLines={1}>
              {vehicle.variantName} · {humanise(vehicle.fuelType)} · {vehicle.branchCity}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: spacing.xs }}>
            <Text variant="price" tone="inverse">
              {formatPence(vehicle.pricePence)}
            </Text>
            {vehicle.condition === 'NEW' || !vehicle.available ? (
              <Badge label={vehicle.available ? 'New' : 'Reserved'} tone={vehicle.available ? 'accent' : 'warning'} />
            ) : null}
          </View>
        </Pressable>
      </Carousel.Caption>
    </View>
  );
}
