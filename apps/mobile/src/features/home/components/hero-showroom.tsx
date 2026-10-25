import { router } from 'expo-router';
import { Suspense, lazy } from 'react';
import { View } from 'react-native';
import { Skeleton } from '@/components/panel/skeleton';
import { FullscreenShowroom } from '@/features/vehicle-3d/components/fullscreen-showroom';
import type { VehicleSummary } from '@car-dealer/contracts';
import { useScreenActive } from '@/features/vehicle-3d/hooks/use-screen-active';

// The 3D engine (three.js, GL) is only evaluated once someone asks for the 360° view; the header itself is just a photo.
const Vehicle360Content = lazy(() =>
  import('@/features/vehicle-3d/components/vehicle-360-content').then((m) => ({ default: m.Vehicle360Content })),
);

/** Full-screen 360° showroom for the featured car the customer is looking at. Mounted only while open. */
export function HeroShowroom({ vehicle, visible, onClose }: { vehicle: VehicleSummary | undefined; visible: boolean; onClose: () => void }) {
  const screenActive = useScreenActive();
  const active = visible && screenActive;
  return (
    <FullscreenShowroom visible={visible} onClose={onClose}>
      {vehicle && active ? (
        <Suspense fallback={<View style={{ flex: 1 }}><Skeleton className="h-full w-full rounded-none" style={{ flex: 1 }} /></View>}>
          <Vehicle360Content
            slug={vehicle.slug}
            title={vehicle.title}
            posterUrl={vehicle.imageUrl}
            active
            height="fill"
            fullscreen
            onToggleFullscreen={onClose}
            onOpenDetails={() => {
              onClose();
              router.push({ pathname: '/cars/[slug]', params: { slug: vehicle.slug } });
            }}
          />
        </Suspense>
      ) : null}
    </FullscreenShowroom>
  );
}
