/* eslint-disable react/no-unknown-property -- react-three-fiber elements, not DOM */
import { useThree } from '@react-three/fiber/native';
import { useEffect } from 'react';
import { PMREMGenerator } from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/**
 * Reflections come from a procedural studio (softboxes in a dark room) prefiltered once on the GPU, so metallic
 * paint and glass have something to reflect without downloading an HDRI. If the device's GL context cannot build
 * it, the car is still lit by the direct lights below: it loses reflections, not the viewer.
 */
function useStudioReflections() {
  const get = useThree((s) => s.get);

  useEffect(() => {
    const { gl, scene, invalidate } = get();
    let generator: PMREMGenerator | null = null;
    let target: ReturnType<PMREMGenerator['fromScene']> | null = null;
    try {
      generator = new PMREMGenerator(gl);
      const room = new RoomEnvironment();
      target = generator.fromScene(room, 0.04);
      room.dispose();
      scene.environment = target.texture;
      scene.environmentIntensity = 0.95;
      invalidate();
    } catch (err) {
      console.warn('[car-3d] Studio reflections unavailable on this device:', err instanceof Error ? err.message : err);
    }
    return () => {
      scene.environment = null;
      target?.dispose();
      generator?.dispose();
    };
  }, [get]);
}

/** Key, fill and two rim lights around a dark studio. No shadow maps: contact shadow is drawn by the platform. */
export function CarStudioLighting() {
  useStudioReflections();
  return (
    <>
      <hemisphereLight args={['#c9d4e6', '#0b0c10', 0.35]} />
      <directionalLight position={[4, 7, 6]} intensity={1.6} color="#ffffff" />
      <directionalLight position={[-6, 3, 2]} intensity={0.5} color="#b8c7ff" />
      <directionalLight position={[-5, 4, -7]} intensity={1.1} color="#dfe8ff" />
      <directionalLight position={[6, 3, -6]} intensity={0.9} color="#ffe9d6" />
    </>
  );
}
