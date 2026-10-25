import { Image } from 'expo-image';
import { View } from 'react-native';
import { Badge, Button, Text } from '@/components/ui';
import { spacing } from '@/theme';
import type { UploadItem } from '../lib/upload-queue';
import { usePhotoUploads } from '../hooks/use-photo-uploads';

const statusLabel = { queued: 'Waiting', uploading: 'Uploading…', done: 'Uploaded', error: 'Failed' } as const;
const statusTone = { queued: 'neutral', uploading: 'accent', done: 'success', error: 'warning' } as const;

function UploadRow({ item, onRetry, onDiscard }: { item: UploadItem; onRetry: () => void; onDiscard: () => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
      <Image source={{ uri: item.uri }} accessibilityLabel="Selected photo preview" style={{ width: 72, height: 54, borderRadius: 6 }} contentFit="cover" />
      <View style={{ flex: 1, gap: spacing.xs }}>
        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
          <Badge label={statusLabel[item.status]} tone={statusTone[item.status]} />
          {item.replaceImageId ? <Text variant="caption" tone="muted">Replacement</Text> : null}
        </View>
        {item.error ? <Text variant="caption" tone="danger" accessibilityRole="alert">{item.error}</Text> : null}
      </View>
      {item.status === 'error' ? <Button title="Retry" variant="secondary" onPress={onRetry} /> : null}
      {item.status !== 'uploading' ? <Button title={item.status === 'done' ? 'Dismiss' : 'Remove'} variant="ghost" onPress={onDiscard} /> : null}
    </View>
  );
}

/** Pick from the gallery or camera, preview, upload, and retry failures. Lives under the photo manager for one vehicle. */
export function VehiclePhotoUploader({ vehicleId, storedCount }: { vehicleId: string; storedCount: number }) {
  const uploads = usePhotoUploads(vehicleId, storedCount);
  const full = uploads.slotsLeft === 0;

  return (
    <View style={{ gap: spacing.md }}>
      <Text variant="caption" tone="muted">
        {storedCount} of 20 photos · JPEG, PNG or WebP · metadata such as location is removed on upload
      </Text>
      <View style={{ gap: spacing.sm }}>
        <Button title="Choose from gallery" disabled={full} onPress={() => void uploads.pickFromGallery()} />
        <Button title="Take photo" variant="secondary" disabled={full} onPress={() => void uploads.takePhoto()} />
      </View>
      {uploads.notice ? <Text variant="caption" tone="danger" accessibilityRole="alert">{uploads.notice}</Text> : null}
      {uploads.items.map((item) => (
        <UploadRow key={item.id} item={item} onRetry={() => uploads.retry(item.id)} onDiscard={() => uploads.discard(item.id)} />
      ))}
    </View>
  );
}
