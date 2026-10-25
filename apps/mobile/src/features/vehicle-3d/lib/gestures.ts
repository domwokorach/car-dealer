import { frameIndexFromDrag, type ViewerController } from '@car-dealer/utils';
import { Gesture } from 'react-native-gesture-handler';

/** Size of the touch surface, read by gesture handlers at event time. A plain object rather than React state or a ref: it changes on layout and must never cause a render. */
export class Viewport {
  width = 1;
  height = 1;
  set(width: number, height: number) {
    this.width = width || 1;
    this.height = height || 1;
  }
}

/** Mutable turntable state shared between the gesture, the auto-rotate timer and the renderer, outside React. */
export class TurntableState {
  index = 0;
  touching = false;
  lastTouchAt = 0;
  readonly viewport = new Viewport();
  showFrame(index: number) {
    this.index = index;
  }
  /** Lets auto-rotate carry on straight away instead of waiting out the pause after a touch. */
  resumeNow() {
    this.lastTouchAt = 0;
  }
}

/**
 * Drag orbits, pinch zooms, and both can happen at once. Everything runs on the JS thread because the controller
 * and renderer live there; events only mutate the controller and request a frame, so no React render is involved.
 */
export function createOrbitGesture(controller: ViewerController, viewport: Viewport, onInteractionChange?: (interacting: boolean) => void) {
  const begin = () => {
    controller.beginInteraction();
    onInteractionChange?.(true);
  };
  const end = () => {
    controller.endInteraction(Date.now());
    onInteractionChange?.(false);
  };
  // The event carries the total translation; the controller wants the movement since the previous event.
  const last = { x: 0, y: 0 };
  const pan = Gesture.Pan()
    .runOnJS(true)
    .maxPointers(1)
    .minDistance(1)
    .onBegin(() => {
      last.x = 0;
      last.y = 0;
      begin();
    })
    .onUpdate((e) => {
      controller.dragBy(e.translationX - last.x, e.translationY - last.y, viewport.width, viewport.height);
      last.x = e.translationX;
      last.y = e.translationY;
    })
    .onFinalize(end);
  const pinch = Gesture.Pinch()
    .runOnJS(true)
    .onBegin(begin)
    .onUpdate((e) => controller.pinchTo(e.scale))
    .onFinalize(end);
  return Gesture.Simultaneous(pan, pinch);
}

/** Horizontal drag only: the photographs contain no other angle to move to. */
export function createTurntableGesture(
  state: TurntableState,
  opts: { count: number; setIndex: (index: number) => void; onInteractionChange?: (interacting: boolean) => void },
) {
  let start = 0;
  return Gesture.Pan()
    .runOnJS(true)
    .maxPointers(1)
    .minDistance(1)
    .onBegin(() => {
      start = state.index;
      state.touching = true;
      opts.onInteractionChange?.(true);
    })
    .onUpdate((e) => opts.setIndex(frameIndexFromDrag(start, e.translationX, state.viewport.width, opts.count)))
    .onFinalize(() => {
      state.touching = false;
      state.lastTouchAt = Date.now();
      opts.onInteractionChange?.(false);
    });
}
