import { Stack, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/layout/screen';
import { EmptyState, LoadingState } from '@/components/ui';
import { useMe } from '@/features/authentication/api/queries';
import { VehiclePhotoManager } from '@/features/media/components/vehicle-photo-manager';
import { isStaffUser } from '@/features/media/lib/is-staff';
import { useRequireAuth } from '@/hooks/use-require-auth';

export default function StaffVehiclePhotosScreen() {
  const { vehicleId, title } = useLocalSearchParams<{ vehicleId: string; title?: string }>();
  const { ready, signedIn } = useRequireAuth();
  const me = useMe();

  return (
    <Screen>
      <Stack.Screen options={{ title: title ?? 'Vehicle photos' }} />
      {!ready || !signedIn || me.isPending ? (
        <LoadingState />
      ) : isStaffUser(me.data) ? (
        <VehiclePhotoManager vehicleId={vehicleId} />
      ) : (
        <EmptyState title="Staff only" message="Vehicle photos can be managed by branch staff and head office." />
      )}
    </Screen>
  );
}
