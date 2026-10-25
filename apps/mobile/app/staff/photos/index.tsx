import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Card } from '@/components/panel/card';
import { Screen } from '@/components/layout/screen';
import { EmptyState, ErrorState, LoadingState, Text } from '@/components/ui';
import { useMe } from '@/features/authentication/api/queries';
import { useStaffInventory } from '@/features/media/api/queries';
import { isStaffUser } from '@/features/media/lib/is-staff';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { spacing } from '@/theme';

export default function StaffPhotoVehiclesScreen() {
  const { ready, signedIn } = useRequireAuth();
  const me = useMe();
  const inventory = useStaffInventory();
  const staff = isStaffUser(me.data);

  return (
    <Screen>
      {!ready || !signedIn || me.isPending ? (
        <LoadingState />
      ) : !staff ? (
        <EmptyState title="Staff only" message="Vehicle photos can be managed by branch staff and head office." />
      ) : inventory.isPending ? (
        <LoadingState />
      ) : inventory.isError ? (
        <ErrorState error={inventory.error} onRetry={() => void inventory.refetch()} />
      ) : inventory.data.items.length === 0 ? (
        <EmptyState title="No vehicles" message="There is no stock at the branches you can access." />
      ) : (
        <View style={{ gap: spacing.md }}>
          {inventory.data.items.map((v) => (
            <Pressable
              key={v.id}
              accessibilityRole="button"
              accessibilityLabel={`Manage photos for ${v.modelName} ${v.variantName}`}
              onPress={() => router.push({ pathname: '/staff/photos/[vehicleId]', params: { vehicleId: v.id, title: `${v.modelName} ${v.variantName}` } })}
            >
              <Card>
                <Card.Header>
                  <Card.Title>{v.modelName} {v.variantName}</Card.Title>
                  <Text variant="caption" tone="muted">{v.vin ?? 'No VIN'}</Text>
                </Card.Header>
              </Card>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}
