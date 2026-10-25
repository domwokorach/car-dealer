import { ApiError } from '@car-dealer/api-client';
import { formatPence } from '@car-dealer/utils';
import { View } from 'react-native';
import { Alert } from '@/components/panel/alert';
import { Countdown } from '@/components/panel/countdown';
import { Button, Text } from '@/components/ui';
import { spacing } from '@/theme';
import { formatDateTime } from '@/utils/format';
import { useReserve } from '../api/mutations';

function explain(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 409) return 'Sorry, this car has just been reserved by someone else.';
    if (error.status === 429) return 'Too many attempts. Please wait a minute and try again.';
    if (error.status === 401) return 'Please sign in again to continue.';
    if (error.status < 500) return error.message;
  }
  return 'Something went wrong. Please try again.';
}

export function ReserveConfirm({ listingId, title, onDone }: { listingId: string; title?: string | undefined; onDone: () => void }) {
  const mutation = useReserve(listingId);

  if (mutation.isSuccess) {
    return (
      <View style={{ gap: spacing.lg }}>
        <Text variant="title">Reserved</Text>
        <Text>
          {title ?? 'Your car'} is held for you at <Text style={{ fontWeight: '600' }}>{formatPence(mutation.data.pricePence)}</Text> until{' '}
          {formatDateTime(mutation.data.expiresAt)}.
        </Text>
        <Countdown to={new Date(mutation.data.expiresAt)} />
        <Text tone="muted">That price is locked in for you, even if the advertised price changes. Your branch will be in touch.</Text>
        <Button title="Done" onPress={onDone} />
      </View>
    );
  }
  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="title">Reserve this car</Text>
      {title ? <Text variant="heading">{title}</Text> : null}
      <Alert variant="info">
        <Alert.Content>
          <Alert.Title>We’ll hold it and lock in today’s price</Alert.Title>
          <Alert.Description>Nothing is charged online. The hold lasts for a limited time; the exact expiry is shown once confirmed.</Alert.Description>
        </Alert.Content>
      </Alert>
      {mutation.isError ? (
        <Alert variant="destructive" accessibilityRole="alert">
          <Alert.Content>
            <Alert.Description>{explain(mutation.error)}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}
      <Button title="Confirm reservation" loading={mutation.isPending} onPress={() => mutation.mutate()} />
    </View>
  );
}
