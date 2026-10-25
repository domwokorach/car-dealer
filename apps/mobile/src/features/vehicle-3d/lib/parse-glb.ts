// Importing the native entry installs the Blob / URL.createObjectURL / TextureLoader polyfills that GLTFLoader needs
// to turn a texture embedded in a .glb into something expo-gl can upload. It must come before the loader runs.
import '@react-three/fiber/native';
import { File } from 'expo-file-system';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { boundTextureQuality, prepareModel, type PreparedModel } from './scene-utils';

const PARSE_TIMEOUT_MS = 60_000;

/** Reads a downloaded .glb from disk and turns it into a studio-ready scene. */
export async function loadGlbFromFile(uri: string, maxAnisotropy: number): Promise<PreparedModel> {
  const buffer = await new File(uri).arrayBuffer();
  const gltf = await new Promise<{ scene: import('three').Group }>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('The 3D model took too long to prepare.')), PARSE_TIMEOUT_MS);
    new GLTFLoader().parse(
      buffer,
      '',
      (result) => {
        clearTimeout(timer);
        resolve(result);
      },
      (error) => {
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error('The 3D model could not be read.'));
      },
    );
  });
  const prepared = prepareModel(gltf.scene);
  boundTextureQuality(prepared.root, maxAnisotropy);
  return prepared;
}
