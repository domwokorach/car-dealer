import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/layout/screen';
import { LoadingState } from '@/components/ui';
import { ReserveConfirm } from '@/features/reservations/components/reserve-confirm';
import { useRequireAuth } from '@/hooks/use-require-auth';

export default function ReservationScreen() {
  const { vehicleId, title } = useLocalSearchParams<{ vehicleId: string; title?: string }>();
  const { ready, signedIn } = useRequireAuth();
  return (
    <Screen>
      {ready && signedIn ? <ReserveConfirm listingId={vehicleId} title={title} onDone={() => router.back()} /> : <LoadingState />}
    </Screen>
  );
}
