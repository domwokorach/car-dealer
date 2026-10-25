/* eslint-disable react/no-unknown-property -- react-three-fiber elements, not DOM */
import { useEffect, useMemo } from 'react';
import { createContactShadowTexture } from '../lib/scene-utils';

/**
 * The showroom floor: a dark satin turntable disc with a thin lit rim, and a soft contact shadow sized to the car.
 * Its top surface is y = 0, which is where the car's wheels rest.
 */
export function CarStudioPlatform({ carLength, carWidth }: { carLength: number; carWidth: number }) {
  const radius = Math.max(carLength * 0.95, 3.2);
  const shadow = useMemo(() => createContactShadowTexture(128), []);
  useEffect(() => () => shadow.dispose(), [shadow]);

  return (
    <group>
      <mesh position={[0, -0.06, 0]}>
        <cylinderGeometry args={[radius, radius, 0.12, 96]} />
        {/* Lambert: scene.environment only feeds Standard/Physical materials, so the floor stays dark instead of mirroring the studio. */}
        <meshLambertMaterial color="#1a1d23" />
      </mesh>
      <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius - 0.07, radius - 0.03, 96]} />
        <meshBasicMaterial color="#8fa2c4" transparent opacity={0.55} />
      </mesh>
      {/* Plane is square; scaled to the car's footprint. x is the car's width axis, z its length. */}
      <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[carWidth * 1.3, carLength * 1.15, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={shadow} transparent opacity={0.95} depthWrite={false} />
      </mesh>
    </group>
  );
}
