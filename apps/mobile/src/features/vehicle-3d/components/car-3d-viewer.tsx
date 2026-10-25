import type { PublicVehicleModel } from '@car-dealer/contracts';
import { useEffect, useMemo, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import { useReducedMotion } from 'react-native-reanimated';
import { useModelAsset } from '../hooks/use-model-asset';
import { Viewport, createOrbitGesture } from '../lib/gestures';
import { Car3DControls } from './car-3d-controls';
import { Car3DLoading, Car3DMessage, StudioPoster } from './car-3d-fallback';
import { Car3DScene } from './car-3d-scene';
import { ViewerController, type ViewPresetId } from '@car-dealer/utils';

export interface Car3DViewerProps {
  model: PublicVehicleModel;
  title: string;
  /** Poster photo shown behind the loading state. */
  posterUrl?: string | null;
  /** Fixed height in points, or 'fill' to take the space the parent gives it (full screen). */
  height: number | 'fill';
  /** False while the tab/screen is hidden or the app is backgrounded: nothing downloads, renders or holds GPU memory. */
  active: boolean;
  fullscreen?: boolean;
  onToggleFullscreen?: () => void;
  /** Lets a parent ScrollView stand aside while the car is being turned. */
  onInteractionChange?: (interacting: boolean) => void;
}

/**
 * Interactive 3D showroom for one vehicle: horizontal drag turns the car through any angle, vertical drag moves the
 * camera within useful limits, pinch zooms, and the buttons give presets and auto-rotate.
 */
export function Car3DViewer({ model, title, posterUrl, height, active, fullscreen = false, onToggleFullscreen, onInteractionChange }: Car3DViewerProps) {
  const reducedMotion = useReducedMotion();
  const [controller] = useState(() => new ViewerController({ reducedMotion }));
  const [autoRotateWanted, setAutoRotate] = useState(true);
  const autoRotate = autoRotateWanted && !reducedMotion;
  const [cancelled, setCancelled] = useState(false);
  const { state, retry } = useModelAsset(model, active && !cancelled);
  const [viewport] = useState(() => new Viewport());

  useEffect(() => {
    controller.setReducedMotion(reducedMotion);
  }, [controller, reducedMotion]);

  const gesture = useMemo(() => createOrbitGesture(controller, viewport, onInteractionChange), [controller, viewport, onInteractionChange]);

  const onLayout = (e: LayoutChangeEvent) => {
    viewport.set(e.nativeEvent.layout.width, e.nativeEvent.layout.height);
  };
  const toggleAutoRotate = () => {
    const next = !autoRotate;
    controller.setAutoRotate(next);
    setAutoRotate(next);
  };
  const goTo = (id: ViewPresetId) => controller.goTo(id, Date.now());

  return (
    <View
      onLayout={onLayout}
      style={[{ backgroundColor: '#0a0b0e', overflow: 'hidden' }, height === 'fill' ? { flex: 1 } : { height }]}
    >
      <StudioPoster uri={posterUrl} label={`${title} photo`} />

      {state.phase === 'ready' ? (
        <>
          <GestureDetector gesture={gesture}>
            <View
              style={{ flex: 1 }}
              accessible
              accessibilityRole="adjustable"
              accessibilityLabel={`Interactive 3D view of ${title}. Drag to rotate, pinch to zoom.`}
              accessibilityActions={[
                { name: 'increment', label: 'Rotate right' },
                { name: 'decrement', label: 'Rotate left' },
              ]}
              onAccessibilityAction={(e) => controller.dragBy(e.nativeEvent.actionName === 'increment' ? 120 : -120, 0, viewport.width, viewport.height)}
            >
              <Car3DScene prepared={state.model} controller={controller} />
            </View>
          </GestureDetector>
          <Car3DControls
            autoRotate={autoRotate}
            onToggleAutoRotate={toggleAutoRotate}
            onPreset={goTo}
            fullscreen={fullscreen}
            onToggleFullscreen={onToggleFullscreen}
            showAutoRotate={!reducedMotion}
          />
        </>
      ) : null}

      {state.phase === 'downloading' ? <Car3DLoading stage="downloading" progress={state.progress} onCancel={() => setCancelled(true)} /> : null}
      {state.phase === 'preparing' ? <Car3DLoading stage="preparing" /> : null}
      {state.phase === 'error' ? (
        <Car3DMessage title="3D view unavailable" message={state.message} actionLabel="Try again" onAction={retry} />
      ) : null}
      {cancelled && state.phase === 'idle' ? (
        <Car3DMessage title="3D view paused" message="Loading was cancelled." actionLabel="Load 3D view" onAction={() => setCancelled(false)} />
      ) : null}
    </View>
  );
}
