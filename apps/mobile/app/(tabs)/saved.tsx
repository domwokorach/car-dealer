import { router } from 'expo-router';
import { Screen } from '@/components/layout/screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui';
import { VehicleCard } from '@/components/vehicles/vehicle-card';
import { useSavedListings } from '@/features/favourites/api/queries';
import { openVehicle } from '@/features/catalogue/components/vehicle-list';
import { useAuth } from '@/providers/auth-provider';

export default function SavedScreen() {
  const { ready, signedIn } = useAuth();
  const saved = useSavedListings();

  return (
    <Screen onRefresh={() => void saved.refetch()} refreshing={saved.isRefetching}>
      {!ready ? (
        <LoadingState />
      ) : !signedIn ? (
        <EmptyState
          title="Save the cars you love"
          message="Sign in to keep a shortlist across your devices."
          actionLabel="Sign in"
          onAction={() => router.push({ pathname: '/sign-in', params: { next: '/saved' } })}
        />
      ) : saved.isPending ? (
        <LoadingState />
      ) : saved.isError ? (
        <ErrorState error={saved.error} onRetry={() => void saved.refetch()} />
      ) : saved.data.length === 0 ? (
        <EmptyState title="Nothing saved yet" message="Tap the heart on any car to save it here." actionLabel="Browse cars" onAction={() => router.push('/cars')} />
      ) : (
        saved.data.map((v) => <VehicleCard key={v.slug} vehicle={v} onPress={() => openVehicle(v.slug)} />)
      )}
    </Screen>
  );
}
