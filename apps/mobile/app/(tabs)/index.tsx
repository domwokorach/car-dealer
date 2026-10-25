import { router } from 'expo-router';
import { Pressable, View, useWindowDimensions } from 'react-native';
import { Card } from '@/components/panel/card';
import { Carousel } from '@/components/panel/carousel';
import { Screen } from '@/components/layout/screen';
import { SectionHeader } from '@/components/layout/section-header';
import { VehicleCard, VehicleCardSkeleton } from '@/components/vehicles/vehicle-card';
import { EmptyState, ErrorState } from '@/components/ui';
import { CarHeroHeader } from '@/features/home/components/car-hero-header';
import { useBranches, useLatestVehicles } from '@/features/catalogue/api/queries';
import { openVehicle } from '@/features/catalogue/components/vehicle-list';
import { useFeaturedVehicles } from '@/features/home/api/queries';
import { useRefresh } from '@/hooks/use-refresh';
import { spacing } from '@/theme';

export default function HomeScreen() {
  const latest = useLatestVehicles(6);
  const branches = useBranches();
  const { width } = useWindowDimensions();
  const featured = useFeaturedVehicles();
  const { refreshing, onRefresh } = useRefresh([latest.refetch, branches.refetch, featured.refetch]);
  const cardWidth = Math.min(width - spacing.lg * 2, 420);

  return (
    <Screen padded={false} refreshing={refreshing} onRefresh={onRefresh} contentStyle={{ gap: spacing.xxl }}>
      <CarHeroHeader />

      <View style={{ gap: spacing.lg }}>
        <View style={{ paddingHorizontal: spacing.lg }}>
          <SectionHeader title="Latest arrivals" actionLabel="View all" onAction={() => router.push('/cars')} />
        </View>
        {latest.isPending ? (
          <View style={{ paddingHorizontal: spacing.lg }}>
            <VehicleCardSkeleton />
          </View>
        ) : latest.isError ? (
          <ErrorState error={latest.error} onRetry={() => void latest.refetch()} />
        ) : latest.data.items.length === 0 ? (
          <EmptyState title="No vehicles are listed yet" />
        ) : (
          <Carousel itemSize={cardWidth + spacing.md} align="start">
            <Carousel.Content style={{ paddingHorizontal: spacing.lg }}>
              {latest.data.items.map((v) => (
                <Carousel.Item key={v.slug} style={{ width: cardWidth, marginRight: spacing.md }}>
                  <VehicleCard vehicle={v} onPress={() => openVehicle(v.slug)} />
                </Carousel.Item>
              ))}
            </Carousel.Content>
          </Carousel>
        )}
      </View>

      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.lg }}>
        <SectionHeader title="Our branches" actionLabel="Map" onAction={() => router.push('/branches')} />
        {branches.isPending ? (
          <VehicleCardSkeleton />
        ) : branches.isError ? (
          <ErrorState error={branches.error} onRetry={() => void branches.refetch()} />
        ) : (
          branches.data.map((b) => (
            <Pressable key={b.id} accessibilityRole="button" accessibilityLabel={b.name} onPress={() => router.push({ pathname: '/branches/[slug]', params: { slug: b.code.toLowerCase() } })}>
              <Card>
                <Card.Header>
                  <Card.Title>{b.name}</Card.Title>
                  <Card.Description>{`${b.addressLine1}, ${b.city} ${b.postcode}`}</Card.Description>
                </Card.Header>
              </Card>
            </Pressable>
          ))
        )}
      </View>
    </Screen>
  );
}
