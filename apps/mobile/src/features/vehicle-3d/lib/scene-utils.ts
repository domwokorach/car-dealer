import { fitModel, type ModelFit } from '@car-dealer/utils';
import {
  Box3,
  DataTexture,
  Group,
  LinearFilter,
  Mesh,
  RGBAFormat,
  UnsignedByteType,
  Vector3,
  type BufferGeometry,
  type Material,
  type Object3D,
  type Texture,
} from 'three';

export interface PreparedModel {
  /** Add this to the scene: centred on the origin, standing on y = 0, at studio scale. */
  root: Group;
  fit: ModelFit;
  /** Size after scaling and rotation (world units). */
  size: Vector3;
}

const MAP_KEYS = [
  'map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap', 'alphaMap', 'bumpMap',
  'clearcoatMap', 'clearcoatNormalMap', 'clearcoatRoughnessMap', 'transmissionMap', 'thicknessMap', 'sheenColorMap',
  'sheenRoughnessMap', 'specularIntensityMap', 'specularColorMap', 'iridescenceMap', 'anisotropyMap',
] as const;

/**
 * Stands any model on the platform at a consistent size: measures it, rotates a Z-up export upright, scales the
 * car to the studio length, centres it horizontally and rests its lowest point on y = 0.
 */
export function prepareModel(source: Object3D): PreparedModel {
  const raw = new Box3().setFromObject(source).getSize(new Vector3());
  const fit = fitModel({ x: raw.x, y: raw.y, z: raw.z });

  const root = new Group();
  const pivot = new Group();
  pivot.add(source);
  pivot.rotation.x = fit.rotationX;
  pivot.scale.setScalar(fit.scale);
  root.add(pivot);
  root.updateMatrixWorld(true);

  const box = new Box3().setFromObject(root);
  const centre = box.getCenter(new Vector3());
  pivot.position.set(-centre.x, -box.min.y, -centre.z);
  root.updateMatrixWorld(true);

  return { root, fit, size: new Box3().setFromObject(root).getSize(new Vector3()) };
}

/** Caps anisotropic filtering: sharp enough for paint and wheels without the bandwidth of the device maximum. */
export function boundTextureQuality(root: Object3D, maxAnisotropy: number): void {
  root.traverse((node) => {
    const mesh = node as Mesh;
    if (!mesh.isMesh) return;
    mesh.frustumCulled = true;
    for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      for (const key of MAP_KEYS) {
        const texture = (material as unknown as Record<string, Texture | null | undefined>)[key];
        if (texture) texture.anisotropy = Math.min(texture.anisotropy || 1, maxAnisotropy);
      }
    }
  });
}

/** Releases GPU memory held by a model: geometry, materials and every texture they reference. */
export function disposeObject(root: Object3D): void {
  const geometries = new Set<BufferGeometry>();
  const materials = new Set<Material>();
  root.traverse((node) => {
    const mesh = node as Mesh;
    if (!mesh.isMesh) return;
    geometries.add(mesh.geometry);
    for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) materials.add(m);
  });
  for (const material of materials) {
    for (const key of MAP_KEYS) (material as unknown as Record<string, Texture | null | undefined>)[key]?.dispose();
    material.dispose();
  }
  for (const geometry of geometries) geometry.dispose();
}

/**
 * A soft elliptical contact shadow as a tiny RGBA texture (black, alpha fading from the centre). Cheaper and far
 * more stable on mobile than a real shadow map, and it never shimmers while the car turns.
 */
export function createContactShadowTexture(size = 128): DataTexture {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = (x + 0.5) / size - 0.5;
      const dy = (y + 0.5) / size - 0.5;
      const d = Math.min(1, Math.hypot(dx, dy) * 2);
      const falloff = Math.pow(1 - d, 1.25);
      data.set([0, 0, 0, Math.round(falloff * 255)], (y * size + x) * 4);
    }
  }
  const texture = new DataTexture(data, size, size, RGBAFormat, UnsignedByteType);
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}
