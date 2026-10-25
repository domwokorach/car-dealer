import type { StaffVehicleImage } from '@car-dealer/contracts';
import { Image } from 'expo-image';
import { Alert, View } from 'react-native';
import { Badge, Button, EmptyState, ErrorState, LoadingState, Text } from '@/components/ui';
import { spacing } from '@/theme';
import { useRemoveImage, useReorderImages, useSetPrimaryImage } from '../api/mutations';
import { useVehicleImages } from '../api/queries';
import { usePhotoUploads } from '../hooks/use-photo-uploads';
import { moveItem } from '../lib/upload-queue';
import { VehiclePhotoUploader } from './vehicle-photo-uploader';

function PhotoRow({
  image,
  index,
  total,
  busy,
  onMove,
  onPrimary,
  onDelete,
  onReplace,
}: {
  image: StaffVehicleImage;
  index: number;
  total: number;
  busy: boolean;
  onMove: (offset: -1 | 1) => void;
  onPrimary: () => void;
  onDelete: () => void;
  onReplace: () => void;
}) {
  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
        <Image source={{ uri: image.url }} accessibilityLabel={image.altText ?? `Photo ${index + 1}`} style={{ width: 112, height: 84, borderRadius: 6 }} contentFit="cover" transition={150} />
        <View style={{ flex: 1, gap: spacing.xs }}>
          <Text variant="caption">Photo {index + 1} of {total}</Text>
          {image.isPrimary ? <Badge label="Cover" tone="accent" /> : null}
          {image.width && image.height ? <Text variant="caption" tone="muted">{image.width}×{image.height}</Text> : null}
        </View>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        <Button title="Move up" variant="ghost" disabled={busy || index === 0} onPress={() => onMove(-1)} />
        <Button title="Move down" variant="ghost" disabled={busy || index === total - 1} onPress={() => onMove(1)} />
        {!image.isPrimary ? <Button title="Make cover" variant="secondary" disabled={busy} onPress={onPrimary} /> : null}
        <Button title="Replace" variant="secondary" disabled={busy} onPress={onReplace} />
        <Button title="Delete" variant="ghost" disabled={busy} onPress={onDelete} />
      </View>
    </View>
  );
}

/** Staff view of one vehicle's gallery: cover, order, replace, delete, and the uploader. */
export function VehiclePhotoManager({ vehicleId }: { vehicleId: string }) {
  const images = useVehicleImages(vehicleId);
  const remove = useRemoveImage(vehicleId);
  const setPrimary = useSetPrimaryImage(vehicleId);
  const reorder = useReorderImages(vehicleId);
  // A second hook instance drives replacements so they run through the same queue rules as new uploads.
  const replacements = usePhotoUploads(vehicleId, images.data?.length ?? 0);

  if (images.isPending) return <LoadingState label="Loading photos…" />;
  if (images.isError) return <ErrorState error={images.error} onRetry={() => void images.refetch()} />;

  const list = images.data;
  const busy = remove.isPending || setPrimary.isPending || reorder.isPending;
  const mutationError = remove.error ?? setPrimary.error ?? reorder.error;

  const confirmDelete = (image: StaffVehicleImage) =>
    Alert.alert('Delete this photo?', image.isPrimary ? 'This is the cover photo. The next photo becomes the cover.' : 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove.mutate(image.id) },
    ]);

  const replaceVia = (image: StaffVehicleImage) =>
    Alert.alert('Replace photo', 'Where is the new photo coming from?', [
      { text: 'Gallery', onPress: () => void replacements.pickFromGallery(image.id) },
      { text: 'Camera', onPress: () => void replacements.takePhoto(image.id) },
      { text: 'Cancel', style: 'cancel' },
    ]);

  return (
    <View style={{ gap: spacing.xl }}>
      <VehiclePhotoUploader vehicleId={vehicleId} storedCount={list.length} />
      {replacements.items.length > 0 ? (
        <Text variant="caption" tone="muted">
          Replacement: {replacements.items.map((i) => (i.status === 'error' ? `failed (${i.error})` : i.status)).join(', ')}
        </Text>
      ) : null}
      {mutationError ? <ErrorState error={mutationError} /> : null}
      {list.length === 0 ? (
        <EmptyState title="No photos yet" message="Add photos so customers can see this vehicle. The first one becomes the cover." />
      ) : (
        list.map((image, index) => (
          <PhotoRow
            key={image.id}
            image={image}
            index={index}
            total={list.length}
            busy={busy}
            onMove={(offset) => reorder.mutate(moveItem(list, index, offset).map((i) => i.id))}
            onPrimary={() => setPrimary.mutate(image.id)}
            onDelete={() => confirmDelete(image)}
            onReplace={() => replaceVia(image)}
          />
        ))
      )}
    </View>
  );
}
