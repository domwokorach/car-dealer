import { View } from 'react-native';
import { Alert } from '@/components/panel/alert';
import { EmptyState as PanelEmptyState } from '@/components/panel/empty-state';
import { Spinner } from '@/components/panel/spinner';
import { Button } from './button';

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <View className="items-center p-12">
      <Spinner label={label} />
    </View>
  );
}

export function EmptyState({ title, message, actionLabel, onAction }: { title: string; message?: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <PanelEmptyState>
      <PanelEmptyState.Header>
        <PanelEmptyState.Title>{title}</PanelEmptyState.Title>
        {message ? <PanelEmptyState.Description>{message}</PanelEmptyState.Description> : null}
      </PanelEmptyState.Header>
      {actionLabel && onAction ? (
        <PanelEmptyState.Content>
          <Button title={actionLabel} variant="secondary" onPress={onAction} />
        </PanelEmptyState.Content>
      ) : null}
    </PanelEmptyState>
  );
}

/** Real error, never fake data. Shown when the API is unreachable or returns an error. */
export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = error instanceof Error ? error.message : 'Something went wrong.';
  return (
    <View className="gap-3 p-4">
      <Alert variant="destructive" accessibilityRole="alert">
        <Alert.Content>
          <Alert.Title>Can’t reach the showroom</Alert.Title>
          <Alert.Description>{message}</Alert.Description>
        </Alert.Content>
      </Alert>
      {onRetry ? <Button title="Try again" variant="secondary" onPress={onRetry} /> : null}
    </View>
  );
}
