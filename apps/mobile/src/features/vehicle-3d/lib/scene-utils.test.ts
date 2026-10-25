import { BoxGeometry, Box3, Group, Mesh, MeshStandardMaterial, Texture, Vector3 } from 'three';
import { describe, expect, it, vi } from 'vitest';
import { boundTextureQuality, createContactShadowTexture, disposeObject, prepareModel } from './scene-utils';

const car = (w: number, h: number, l: number, at = new Vector3(5, 7, -3)) => {
  const mesh = new Mesh(new BoxGeometry(w, h, l), new MeshStandardMaterial());
  mesh.position.copy(at); // exported far from the origin, as real files often are
  const group = new Group();
  group.add(mesh);
  return group;
};
const bounds = (root: Group) => new Box3().setFromObject(root);

describe('prepareModel', () => {
  it('centres the car, rests it on the ground and scales it to the studio length', () => {
    const { root, size } = prepareModel(car(1.9, 1.4, 4.5));
    const box = bounds(root);
    expect(box.min.y).toBeCloseTo(0);
    expect(box.getCenter(new Vector3()).x).toBeCloseTo(0);
    expect(box.getCenter(new Vector3()).z).toBeCloseTo(0);
    expect(Math.max(size.x, size.z)).toBeCloseTo(4.6);
  });

  it('normalises wildly different units to the same footprint', () => {
    const tiny = prepareModel(car(0.019, 0.014, 0.045)); // metres → centimetres exports, and so on
    const huge = prepareModel(car(190, 140, 450));
    expect(tiny.size.z).toBeCloseTo(huge.size.z);
  });

  it('stands a Z-up export upright', () => {
    const { root, size } = prepareModel(car(1.9, 4.5, 1.3));
    expect(size.y).toBeLessThan(size.z);
    expect(bounds(root).min.y).toBeCloseTo(0);
  });
});

describe('texture and memory handling', () => {
  it('caps anisotropy', () => {
    const material = new MeshStandardMaterial();
    material.map = new Texture();
    material.map.anisotropy = 16;
    const root = new Group();
    root.add(new Mesh(new BoxGeometry(), material));
    boundTextureQuality(root, 4);
    expect(material.map.anisotropy).toBe(4);
  });

  it('disposes geometry, materials and textures exactly once each', () => {
    const material = new MeshStandardMaterial();
    material.map = new Texture();
    const geometry = new BoxGeometry();
    const root = new Group();
    root.add(new Mesh(geometry, material), new Mesh(geometry, material));
    const spies = [vi.spyOn(geometry, 'dispose'), vi.spyOn(material, 'dispose'), vi.spyOn(material.map, 'dispose')];
    disposeObject(root);
    for (const spy of spies) expect(spy).toHaveBeenCalledTimes(1);
  });

  it('builds a contact shadow that is opaque at the centre and clear at the edge', () => {
    const tex = createContactShadowTexture(32);
    const data = tex.image.data as Uint8Array;
    const alphaAt = (x: number, y: number) => data[(y * 32 + x) * 4 + 3]!;
    expect(alphaAt(16, 16)).toBeGreaterThan(200);
    expect(alphaAt(0, 0)).toBe(0);
    expect(alphaAt(31, 16)).toBeLessThan(10);
  });
});
