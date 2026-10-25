import { router, Stack, useLocalSearchParams } from 'expo-router';
import { FlatList, Linking, Platform, View } from 'react-native';
import { Screen } from '@/components/layout/screen';
import { Button, EmptyState, ErrorState, LoadingState, Text } from '@/components/ui';
import { VehicleCard } from '@/components/vehicles/vehicle-card';
import { useBranches, useVehicles } from '@/features/catalogue/api/queries';
import { useBranchCoordinates } from '@/features/locations/api/coordinates';
import { BranchMap } from '@/features/locations/components/branch-map';
import { openVehicle } from '@/features/catalogue/components/vehicle-list';
import { spacing } from '@/theme';

export default function BranchScreen() {
  // `slug` is the branch code (lower-cased) or the branch id.
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const branches = useBranches();
  const branch = branches.data?.find((b) => b.code.toLowerCase() === slug?.toLowerCase() || b.id === slug);
  const coords = useBranchCoordinates(branch ? [branch] : undefined);
  const stock = useVehicles({ sort: 'newest', ...(branch ? { branchId: branch.id } : {}) });

  if (branches.isPending) return <LoadingState />;
  if (branches.isError) return <ErrorState error={branches.error} onRetry={() => void branches.refetch()} />;
  if (!branch) return <EmptyState title="Branch not found" actionLabel="Go back" onAction={() => router.back()} />;

  const address = encodeURIComponent(`${branch.addressLine1}, ${branch.city} ${branch.postcode}`);
  const mapsUrl = Platform.select({ ios: `https://maps.apple.com/?q=${address}`, default: `https://www.google.com/maps/search/?api=1&query=${address}` });
  const vehicles = stock.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <>
      <Stack.Screen options={{ title: branch.name }} />
      <Screen>
        <View style={{ gap: spacing.xs }}>
          <Text variant="title">{branch.name}</Text>
          <Text tone="muted">
            {branch.addressLine1}
            {'\n'}
            {branch.city}, {branch.postcode}
          </Text>
        </View>
        {branch ? <BranchMap branches={[branch]} coordinates={coords.byId} selectedId={branch.id} locate={false} height={220} /> : null}
        <View style={{ gap: spacing.md }}>
          <Button title="Get directions" onPress={() => void Linking.openURL(mapsUrl)} />
          {branch.phone ? <Button title={`Call ${branch.phone}`} variant="secondary" onPress={() => void Linking.openURL(`tel:${branch.phone?.replace(/\s+/g, '')}`)} /> : null}
          {branch.email ? <Button title="Email the branch" variant="secondary" onPress={() => void Linking.openURL(`mailto:${branch.email}`)} /> : null}
        </View>
        <Text variant="heading">Cars at this branch</Text>
        {stock.isPending ? (
          <LoadingState />
        ) : stock.isError ? (
          <ErrorState error={stock.error} onRetry={() => void stock.refetch()} />
        ) : vehicles.length === 0 ? (
          <Text tone="muted">No cars are listed at this branch right now.</Text>
        ) : (
          <FlatList
            data={vehicles}
            scrollEnabled={false}
            keyExtractor={(v) => v.slug}
            contentContainerStyle={{ gap: spacing.lg }}
            renderItem={({ item }) => <VehicleCard vehicle={item} onPress={() => openVehicle(item.slug)} />}
          />
        )}
      </Screen>
    </>
  );
}
