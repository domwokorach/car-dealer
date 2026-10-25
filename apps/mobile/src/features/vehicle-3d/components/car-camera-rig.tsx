import { frameDistance, type ViewerController } from '@car-dealer/utils';
import { useFrame, useThree } from '@react-three/fiber/native';
import { useEffect, useMemo } from 'react';
import { Vector3, type PerspectiveCamera } from 'three';
import type { PreparedModel } from '../lib/scene-utils';

/**
 * Connects the controller (gestures, presets, auto-rotate) to the three.js camera. Renders on demand: a frame is
 * only requested while something is moving, so a car that is sitting still draws nothing at all.
 */
export function CarCameraRig({ controller, prepared }: { controller: ViewerController; prepared: PreparedModel }) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  const target = useMemo(() => new Vector3(0, prepared.size.y * 0.42, 0), [prepared]);

  useEffect(() => {
    controller.attach(invalidate);
    return () => controller.detach();
  }, [controller, invalidate]);

  // Re-frame whenever the model or the viewport changes: rotating the phone or entering full screen.
  useEffect(() => {
    const aspect = size.width / Math.max(size.height, 1);
    controller.setFit(frameDistance(prepared.fit.radius, camera.fov, aspect));
  }, [controller, camera, prepared, size.width, size.height]);

  useFrame((_, delta) => {
    const needsAnotherFrame = controller.update(delta, Date.now());
    const { azimuth, elevation, distance } = controller.pose;
    const flat = Math.cos(elevation) * distance;
    camera.position.set(target.x + Math.sin(azimuth) * flat, target.y + Math.sin(elevation) * distance, target.z + Math.cos(azimuth) * flat);
    camera.lookAt(target);
    if (needsAnotherFrame) invalidate();
  });

  return null;
}
