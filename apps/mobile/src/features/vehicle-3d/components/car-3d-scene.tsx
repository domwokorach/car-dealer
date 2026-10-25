/* eslint-disable react/no-unknown-property -- react-three-fiber elements, not DOM */
import { Canvas } from '@react-three/fiber/native';
import { ACESFilmicToneMapping } from 'three';
import type { PreparedModel } from '../lib/scene-utils';
import type { ViewerController } from '@car-dealer/utils';
import { CarCameraRig } from './car-camera-rig';
import { CarStudioLighting } from './car-studio-lighting';
import { CarStudioPlatform } from './car-studio-platform';

const BACKGROUND = '#0a0b0e';

/** The studio: one GL canvas holding the platform, lights, the car and the camera rig. */
export function Car3DScene({ prepared, controller }: { prepared: PreparedModel; controller: ViewerController }) {
  return (
    <Canvas
      frameloop="demand"
      camera={{ fov: 35, near: 0.1, far: 80 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
      style={{ flex: 1, backgroundColor: BACKGROUND }}
    >
      <color attach="background" args={[BACKGROUND]} />
      <fog attach="fog" args={[BACKGROUND, 18, 42]} />
      <CarStudioLighting />
      <CarStudioPlatform carLength={Math.max(prepared.size.x, prepared.size.z)} carWidth={Math.min(prepared.size.x, prepared.size.z)} />
      <primitive object={prepared.root} />
      <CarCameraRig controller={controller} prepared={prepared} />
    </Canvas>
  );
}
