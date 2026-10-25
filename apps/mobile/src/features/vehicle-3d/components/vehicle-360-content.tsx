import type { VehicleImage } from '@car-dealer/contracts';
import { View } from 'react-native';
import { Skeleton } from '@/components/panel/skeleton';
import { Button } from '@/components/panel/button';
import { Text } from '@/components/ui';
import { VehicleGallery } from '@/components/vehicles/vehicle-gallery';
import { spacing } from '@/theme';
import { useVehicleModel, useVehicleTurntable } from '../api/queries';
import { Car360ImageViewer } from './car-360-image-viewer';
import { Car3DMessage } from './car-3d-fallback';
import { Car3DViewer } from './car-3d-viewer';

export interface Vehicle360Props {
  slug: string;
  title: string;
  /** Standard photos, used as the poster and as the fallback gallery when the car has no 360° view. */
  images?: VehicleImage[];
  /** Poster when the full photo list isn't to hand (the home header only knows the cover photo). */
  posterUrl?: string | null;
  /** Whether this view is currently visible. Nothing is fetched, downloaded or rendered while false. */
  active: boolean;
  height: number | 'fill';
  fullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onInteractionChange?: (interacting: boolean) => void;
  /** Where the "no 360° view" fallback sends the person when the standard gallery is not shown inline. */
  onOpenDetails?: () => void;
}

/**
 * Chooses the richest experience a vehicle actually has: a real 3D model, else a turntable of real photographs,
 * else the ordinary photo gallery. A photograph is never presented as 3D.
 */
export function Vehicle360Content({ slug, title, images = [], posterUrl, active, height, fullscreen, onToggleFullscreen, onInteractionChange, onOpenDetails }: Vehicle360Props) {
  const model = useVehicleModel(slug, active);
  const turntable = useVehicleTurntable(slug, active && model.isSuccess && model.data === null);
  const poster = posterUrl ?? images.find((i) => i.isPrimary)?.url ?? images[0]?.url ?? null;
  const box = height === 'fill' ? { flex: 1 } : { height };

  if (!active) return <View style={[{ backgroundColor: '#0a0b0e' }, box]} />;

  if (model.isPending || (model.data === null && turntable.isPending)) {
    return (
      <View style={box} accessibilityLabel="Checking for a 3D view" accessibilityRole="progressbar">
        <Skeleton className="h-full w-full rounded-none" style={height === 'fill' ? { flex: 1 } : { height }} />
      </View>
    );
  }

  if (model.isError || (model.data === null && turntable.isError)) {
    const retry = () => void (model.isError ? model.refetch() : turntable.refetch());
    return (
      <View style={[{ backgroundColor: '#0a0b0e' }, box]}>
        <Car3DMessage title="360° view unavailable" message="We couldn’t check for a 3D view. Check your connection and try again." actionLabel="Try again" onAction={retry} />
      </View>
    );
  }

  if (model.data) {
    return (
      <Car3DViewer
        model={model.data}
        title={title}
        posterUrl={model.data.thumbnailUrl ?? poster}
        height={height}
        active={active}
        fullscreen={fullscreen}
        onToggleFullscreen={onToggleFullscreen}
        onInteractionChange={onInteractionChange}
      />
    );
  }

  if (turntable.data) {
    return (
      <Car360ImageViewer
        frames={turntable.data.frames}
        title={title}
        height={height}
        active={active}
        fullscreen={fullscreen}
        onToggleFullscreen={onToggleFullscreen}
        onInteractionChange={onInteractionChange}
      />
    );
  }

  // Neither 3D nor 360° photos exist: say so plainly and fall back to the standard photos.
  return (
    <View style={height === 'fill' ? { flex: 1, backgroundColor: '#0a0b0e' } : { gap: spacing.md }}>
      {height === 'fill' || images.length === 0 ? (
        <Car3DMessage
          title="No 360° view yet"
          message="This car doesn’t have a 3D or 360° view. Its photos are on the car’s page."
          actionLabel={onOpenDetails ? 'View car' : undefined}
          onAction={onOpenDetails}
        />
      ) : (
        <>
          <Text tone="muted">This car doesn’t have a 3D or 360° view yet. Here are its photos.</Text>
          <VehicleGallery images={images} title={title} />
          {onOpenDetails ? <Button variant="outline" onPress={onOpenDetails}>Back to photos</Button> : null}
        </>
      )}
    </View>
  );
}
