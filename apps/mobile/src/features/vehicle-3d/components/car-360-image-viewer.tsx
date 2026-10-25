import { AUTO_ROTATE_RESUME_MS, AUTO_ROTATE_SECONDS_PER_REVOLUTION, frameLoadOrder } from '@car-dealer/utils';
import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import { useReducedMotion } from 'react-native-reanimated';
import { Progress } from '@/components/panel/progress';
import { Text } from '@/components/ui';
import { TurntableState, createTurntableGesture } from '../lib/gestures';
import { HudButton } from './car-3d-controls';

/** Frames mounted either side of the current one. Mounted images are already decoded, so turning never flashes blank. */
const WINDOW = 4;
/** Frames fetched before the viewer is shown; the rest stream in nearest-first behind it. */
const FIRST_BATCH = 6;

/**
 * A 360° view built from real photographs taken around the car. Dragging sideways picks the frame; there is
 * deliberately no vertical orbit and no zoom, because a photograph cannot be viewed from an angle it was not taken at.
 */
export function Car360ImageViewer({
  frames,
  title,
  height,
  active,
  fullscreen = false,
  onToggleFullscreen,
  onInteractionChange,
}: {
  frames: string[];
  title: string;
  height: number | 'fill';
  active: boolean;
  fullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onInteractionChange?: (interacting: boolean) => void;
}) {
  const count = frames.length;
  const reducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [autoRotate, setAutoRotate] = useState(!reducedMotion);
  const [loaded, setLoaded] = useState(0);
  const [ready, setReady] = useState(false);
  const [turn] = useState(() => new TurntableState());

  const show = useCallback(
    (next: number) => {
      turn.showFrame(next);
      setIndex(next);
    },
    [turn],
  );

  // Progressive preload: the first few frames gate the viewer, everything else streams in nearest-first.
  useEffect(() => {
    if (!active) return;
    let live = true;
    const order = frameLoadOrder(0, count);
    (async () => {
      let done = 0;
      const fetchOne = async (i: number) => {
        await Image.prefetch(frames[i]!, { cachePolicy: 'memory-disk' }).catch(() => false);
        done += 1;
        if (live) setLoaded(done);
      };
      await Promise.all(order.slice(0, FIRST_BATCH).map(fetchOne));
      if (live) setReady(true);
      for (let i = FIRST_BATCH; live && i < order.length; i += 3) await Promise.all(order.slice(i, i + 3).map(fetchOne));
    })();
    return () => {
      live = false;
    };
  }, [active, frames, count]);

  // Auto-rotation: one frame per tick, so a full revolution takes AUTO_ROTATE_SECONDS_PER_REVOLUTION whatever the frame count.
  useEffect(() => {
    if (!active || !ready || !autoRotate || reducedMotion || count < 2) return;
    const timer = setInterval(() => {
      if (turn.touching || Date.now() - turn.lastTouchAt < AUTO_ROTATE_RESUME_MS) return;
      show((turn.index + 1) % count);
    }, (AUTO_ROTATE_SECONDS_PER_REVOLUTION * 1000) / count);
    return () => clearInterval(timer);
  }, [active, ready, autoRotate, reducedMotion, count, show, turn]);

  const gesture = useMemo(
    () => createTurntableGesture(turn, { count, setIndex: show, onInteractionChange }),
    [turn, count, show, onInteractionChange],
  );

  const onLayout = (e: LayoutChangeEvent) => {
    turn.viewport.set(e.nativeEvent.layout.width, e.nativeEvent.layout.height);
  };

  const visible = useMemo(() => {
    const out: number[] = [];
    for (let d = -WINDOW; d <= WINDOW; d += 1) out.push(((index + d) % count + count) % count);
    return [...new Set(out)];
  }, [index, count]);

  return (
    <View onLayout={onLayout} style={[{ backgroundColor: '#0a0b0e', overflow: 'hidden' }, height === 'fill' ? { flex: 1 } : { height }]}>
      {active ? (
        <GestureDetector gesture={gesture}>
          <View
            style={{ flex: 1 }}
            accessible
            accessibilityRole="adjustable"
            accessibilityLabel={`360 degree photos of ${title}. Swipe to turn the car.`}
            accessibilityActions={[
              { name: 'increment', label: 'Turn right' },
              { name: 'decrement', label: 'Turn left' },
            ]}
            onAccessibilityAction={(e) => show((turn.index + (e.nativeEvent.actionName === 'increment' ? -1 : 1) + count) % count)}
          >
            {visible.map((i) => (
              <Image
                key={i}
                source={{ uri: frames[i]! }}
                cachePolicy="memory-disk"
                contentFit="contain"
                transition={0}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: i === index ? 1 : 0 }}
              />
            ))}
          </View>
        </GestureDetector>
      ) : null}

      {!ready && active ? (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12, backgroundColor: '#0a0b0e' }}>
          <Text variant="label" tone="inverse">
            Loading photos
          </Text>
          <View style={{ width: '100%', maxWidth: 320 }}>
            <Progress value={Math.min(100, Math.round((loaded / FIRST_BATCH) * 100))} maxValue={100} accessibilityLabel="Loading photos" />
          </View>
        </View>
      ) : null}

      {ready ? (
        <>
          <View pointerEvents="box-none" style={{ position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
            {!reducedMotion ? (
              <HudButton
                label={autoRotate ? 'Pause' : 'Auto rotate'}
                accessibilityLabel={autoRotate ? 'Pause automatic rotation' : 'Start automatic rotation'}
                selected={autoRotate}
                onPress={() => {
                  turn.resumeNow();
                  setAutoRotate((v) => !v);
                }}
              />
            ) : null}
            {onToggleFullscreen ? (
              <HudButton label={fullscreen ? 'Close' : 'Full screen'} accessibilityLabel={fullscreen ? 'Leave full screen' : 'Open full-screen showroom'} onPress={onToggleFullscreen} />
            ) : null}
          </View>
          <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 14, alignItems: 'center' }}>
            <Text variant="caption" tone="inverse" style={{ opacity: 0.7 }}>
              Swipe to turn the car
            </Text>
          </View>
        </>
      ) : null}
    </View>
  );
}
