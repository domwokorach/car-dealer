import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/layout/screen';
import { LoadingState, Text } from '@/components/ui';
import { TestDriveForm } from '@/features/test-drives/components/test-drive-form';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { spacing } from '@/theme';

export default function TestDriveScreen() {
  const { vehicleId, title } = useLocalSearchParams<{ vehicleId: string; title?: string }>();
  const { ready, signedIn } = useRequireAuth();
  return (
    <Screen contentStyle={{ gap: spacing.xl }}>
      {title ? <Text variant="heading">{title}</Text> : null}
      {ready && signedIn ? <TestDriveForm listingId={vehicleId} onDone={() => router.back()} /> : <LoadingState />}
    </Screen>
  );
}
