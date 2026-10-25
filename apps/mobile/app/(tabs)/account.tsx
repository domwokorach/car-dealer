import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Avatar } from '@/components/panel/avatar';
import { Card } from '@/components/panel/card';
import { ThemeSelector } from '@/components/panel/theme-selector';
import { Screen } from '@/components/layout/screen';
import { SectionHeader } from '@/components/layout/section-header';
import { Badge, Button, EmptyState, ErrorState, LoadingState, Text } from '@/components/ui';
import { useMe, useMyReservations, useMyTestDrives } from '@/features/authentication/api/queries';
import { ReservationCard } from '@/features/reservations/components/reservation-card';
import { useRefresh } from '@/hooks/use-refresh';
import { useAuth } from '@/providers/auth-provider';
import { getApi } from '@/services/api';
import { signOut } from '@/services/auth';
import { apiTarget, authConfigured } from '@/services/env';
import { spacing } from '@/theme';
import { isLoopbackUrl } from '@/utils/api-url';
import { formatDateTime, humanise } from '@/utils/format';

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?';
const driveTone = (s: string) => (s === 'CONFIRMED' ? 'success' : s === 'CANCELLED' ? 'warning' : 'neutral');

/** Development-only: shows which API the app is talking to and whether it answers. */
function ConnectionCheck() {
  const [result, setResult] = useState<string>();
  const target = apiTarget.ok ? apiTarget.url : apiTarget.reason;
  async function check() {
    setResult('Checking…');
    try {
      const health = await getApi().health();
      setResult(`API OK · database ${health.database}`);
    } catch (e) {
      setResult(`Failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return (
    <View className="bg-surface" style={{ gap: spacing.sm, padding: spacing.lg, borderRadius: 12 }}>
      <Text variant="label" tone="muted">Developer</Text>
      <Text variant="caption">API: {target}</Text>
      {apiTarget.ok && isLoopbackUrl(apiTarget.url) ? (
        <Text variant="caption" tone="danger">
          localhost points at this device. On a physical phone use your computer’s LAN IP (EXPO_PUBLIC_API_URL).
        </Text>
      ) : null}
      <Text variant="caption">Sign-in: {authConfigured ? 'configured' : 'not configured (set EXPO_PUBLIC_SUPABASE_*)'}</Text>
      {result ? <Text variant="caption">{result}</Text> : null}
      <Button title="Test API connection" variant="secondary" onPress={check} />
      <Button title="PanelUI showcase" variant="secondary" onPress={() => router.push('/dev/showcase')} />
    </View>
  );
}

export default function AccountScreen() {
  const { ready, signedIn, session } = useAuth();
  const me = useMe();
  const reservations = useMyReservations();
  const testDrives = useMyTestDrives();
  const { refreshing, onRefresh } = useRefresh([me.refetch, reservations.refetch, testDrives.refetch]);
  const name = me.data?.fullName ?? session?.user.email ?? 'My account';

  return (
    <Screen refreshing={refreshing} onRefresh={signedIn ? onRefresh : undefined}>
      {!ready ? (
        <LoadingState />
      ) : !signedIn ? (
        <EmptyState
          title="Your account"
          message="Sign in to reserve cars, book test drives and save your favourites."
          actionLabel="Sign in or create an account"
          onAction={() => router.push({ pathname: '/sign-in', params: { next: '/account' } })}
        />
      ) : (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
            <Avatar fallback={initials(name)} />
            <View style={{ flex: 1, gap: spacing.xs }}>
              <Text variant="title" numberOfLines={1}>{name}</Text>
              {me.data?.fullName ? <Text tone="muted" numberOfLines={1}>{session?.user.email}</Text> : null}
            </View>
          </View>

          <View style={{ gap: spacing.md }}>
            <SectionHeader title="Reservations" />
            {reservations.isPending ? <LoadingState /> : reservations.isError ? <ErrorState error={reservations.error} onRetry={() => void reservations.refetch()} /> : reservations.data.length === 0 ? (
              <Text tone="muted">No reservations yet.</Text>
            ) : (
              reservations.data.map((r) => <ReservationCard key={r.id} reservation={r} />)
            )}
          </View>

          <View style={{ gap: spacing.md }}>
            <SectionHeader title="Test drives" />
            {testDrives.isPending ? <LoadingState /> : testDrives.isError ? <ErrorState error={testDrives.error} onRetry={() => void testDrives.refetch()} /> : testDrives.data.length === 0 ? (
              <Text tone="muted">No test drives booked.</Text>
            ) : (
              testDrives.data.map((t) => (
                <Card key={t.id}>
                  <Card.Header>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Card.Title>{formatDateTime(t.scheduledAt)}</Card.Title>
                      <Badge label={humanise(t.status)} tone={driveTone(t.status)} />
                    </View>
                  </Card.Header>
                </Card>
              ))
            )}
          </View>
        </>
      )}

      <View style={{ gap: spacing.md }}>
        <SectionHeader title="Appearance" />
        <ThemeSelector label="Theme" />
      </View>

      <Button title="Contact support" variant="secondary" onPress={() => router.push('/support')} />
      {signedIn ? <Button title="Sign out" variant="secondary" onPress={() => void signOut()} /> : null}
      {__DEV__ ? <ConnectionCheck /> : null}
    </Screen>
  );
}
