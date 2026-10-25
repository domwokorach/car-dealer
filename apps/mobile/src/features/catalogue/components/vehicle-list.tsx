import type { VehicleSummary } from '@car-dealer/contracts';
import { router } from 'expo-router';
import type { ReactElement } from 'react';
import { FlatList, View } from 'react-native';
import { VehicleCard, VehicleCardSkeleton } from '@/components/vehicles/vehicle-card';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui';
import { spacing } from '@/theme';
import type { useVehicles } from '../api/queries';

export const openVehicle = (slug: string) => router.push({ pathname: '/cars/[slug]', params: { slug } });

/** Infinite-scrolling list driven by a `useVehicles` query. */
export function VehicleList({ query, header }: { query: ReturnType<typeof useVehicles>; header?: ReactElement }) {
  const items: VehicleSummary[] = query.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <FlatList
      data={items}
      keyExtractor={(v) => v.slug}
      className="bg-background"
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={header}
      renderItem={({ item }) => <VehicleCard vehicle={item} onPress={() => openVehicle(item.slug)} />}
      onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && void query.fetchNextPage()}
      onEndReachedThreshold={0.5}
      refreshing={query.isRefetching && !query.isFetchingNextPage}
      onRefresh={() => void query.refetch()}
      ListEmptyComponent={
        query.isPending ? (
          <View style={{ gap: spacing.lg }}>
            <VehicleCardSkeleton />
            <VehicleCardSkeleton />
          </View>
        ) : query.isError ? (
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        ) : (
          <EmptyState title="No vehicles match your filters" message="Try removing a filter." />
        )
      }
      ListFooterComponent={query.isFetchingNextPage ? <View style={{ padding: spacing.lg }}><LoadingState /></View> : undefined}
    />
  );
}
