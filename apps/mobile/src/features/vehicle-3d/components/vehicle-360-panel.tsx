import type { VehicleImage } from '@car-dealer/contracts';
import { useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { Text } from '@/components/ui';
import { useScreenActive } from '../hooks/use-screen-active';
import { FullscreenShowroom } from './fullscreen-showroom';
import { Vehicle360Content } from './vehicle-360-content';

/**
 * The "360° View" tab on the vehicle page. `selected` is whether the tab is showing; combined with the screen being
 * focused and the app being in the foreground it decides whether the viewer exists at all.
 */
export function Vehicle360Panel({
  slug,
  title,
  images,
  selected,
  onInteractionChange,
  onShowPhotos,
}: {
  slug: string;
  title: string;
  images: VehicleImage[];
  selected: boolean;
  onInteractionChange?: (interacting: boolean) => void;
  onShowPhotos?: () => void;
}) {
  const { width } = useWindowDimensions();
  const screenActive = useScreenActive();
  const [fullscreen, setFullscreen] = useState(false);

  // Leaving the tab unmounts this panel (and with it the full-screen state); leaving the screen only deactivates it.
  const active = selected && screenActive;
  const height = Math.round(Math.min(Math.max(width * 0.85, 300), 520));

  return (
    <>
      {fullscreen ? (
        <View style={{ height, backgroundColor: '#0a0b0e', alignItems: 'center', justifyContent: 'center' }}>
          <Text tone="inverse" style={{ opacity: 0.7 }}>
            Showing in full screen
          </Text>
        </View>
      ) : (
        <Vehicle360Content
          slug={slug}
          title={title}
          images={images}
          active={active}
          height={height}
          onToggleFullscreen={() => setFullscreen(true)}
          onInteractionChange={onInteractionChange}
          onOpenDetails={onShowPhotos}
        />
      )}
      <FullscreenShowroom visible={fullscreen && active} onClose={() => setFullscreen(false)}>
        {fullscreen && active ? (
          <Vehicle360Content slug={slug} title={title} images={images} active height="fill" fullscreen onToggleFullscreen={() => setFullscreen(false)} />
        ) : null}
      </FullscreenShowroom>
    </>
  );
}
