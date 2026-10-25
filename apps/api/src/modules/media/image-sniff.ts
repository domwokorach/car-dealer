import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from '@car-dealer/contracts';

type ImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

const startsWith = (b: Uint8Array, sig: number[], offset = 0) => sig.every((v, i) => b[offset + i] === v);

/** Detect the real type from magic bytes. The client-declared content type is never trusted. */
export function sniffImageType(bytes: Uint8Array): ImageType | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) return 'image/webp';
  return null;
}

export const EXTENSIONS: Record<ImageType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export function isValidUpload(bytes: Uint8Array): boolean {
  return bytes.byteLength > 0 && bytes.byteLength <= MAX_IMAGE_BYTES && sniffImageType(bytes) !== null;
}
