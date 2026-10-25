import { Image } from 'expo-image';
import { View } from 'react-native';
import { Progress } from '@/components/panel/progress';
import { Skeleton } from '@/components/panel/skeleton';
import { Button } from '@/components/panel/button';
import { Text } from '@/components/ui';
import { spacing } from '@/theme';
import { HudButton } from './car-3d-controls';

/** Backdrop used before and around the 3D view: the car's own photo when there is one, otherwise the studio colour. */
export function StudioPoster({ uri, label }: { uri?: string | null; label: string }) {
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#0a0b0e' }}>
      {uri ? <Image source={{ uri }} accessibilityLabel={label} contentFit="cover" style={{ flex: 1, opacity: 0.55 }} transition={150} /> : null}
    </View>
  );
}

/** Progress overlay while the model downloads or is prepared, with a way out (cancellation) while it downloads. */
export function Car3DLoading({ progress, stage, onCancel }: { progress?: number; stage: 'downloading' | 'preparing'; onCancel?: () => void }) {
  const percent = Math.round((progress ?? 0) * 100);
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={stage === 'downloading' ? `Loading 3D model, ${percent} percent` : 'Preparing 3D model'}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md }}
    >
      <View style={{ width: '100%', maxWidth: 320, gap: spacing.sm }}>
        <Text variant="label" tone="inverse" style={{ textAlign: 'center' }}>
          {stage === 'downloading' ? 'Loading 3D model' : 'Preparing showroom'}
        </Text>
        {stage === 'downloading' ? <Progress value={percent} maxValue={100} accessibilityLabel="Download progress" /> : <Skeleton className="h-2 w-full rounded-full" />}
      </View>
      {stage === 'downloading' && onCancel ? <HudButton label="Cancel" onPress={onCancel} accessibilityLabel="Cancel loading the 3D model" /> : null}
    </View>
  );
}

/** Shown when the model could not be loaded, or the viewer was cancelled: always a way to retry and the photos remain. */
export function Car3DMessage({ title, message, actionLabel, onAction }: { title: string; message: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md }}>
      <Text variant="heading" tone="inverse" style={{ textAlign: 'center' }}>
        {title}
      </Text>
      <Text tone="inverse" style={{ textAlign: 'center', opacity: 0.8 }}>
        {message}
      </Text>
      {actionLabel && onAction ? (
        <Button variant="secondary" size="md" onPress={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}
