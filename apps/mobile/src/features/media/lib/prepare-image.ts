import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

/** Longest edge sent to the server. The API re-encodes and caps at 2560, so this only keeps uploads small on mobile data. */
const MAX_EDGE = 2048;
const QUALITY = 0.8;

export interface PreparedImage {
  uri: string;
  contentType: 'image/jpeg';
  sizeBytes: number;
}

/**
 * Resizes and compresses a picked photo to JPEG before upload. Converting to JPEG also normalises HEIC from iPhones,
 * which the API does not accept. Orientation is baked into the pixels by the manipulator.
 */
export async function prepareImage(uri: string, width?: number, height?: number): Promise<PreparedImage> {
  const context = ImageManipulator.manipulate(uri);
  if (width && height && Math.max(width, height) > MAX_EDGE) {
    context.resize(width >= height ? { width: MAX_EDGE } : { height: MAX_EDGE });
  }
  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({ compress: QUALITY, format: SaveFormat.JPEG });
  const blob = await (await fetch(saved.uri)).blob();
  return { uri: saved.uri, contentType: 'image/jpeg', sizeBytes: blob.size };
}
