import { isValidUpload, sniffImageType } from './image-sniff';

const bytes = (...v: number[]) => Uint8Array.from(v);

describe('sniffImageType', () => {
  it('recognises JPEG, PNG and WebP', () => {
    expect(sniffImageType(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe('image/jpeg');
    expect(sniffImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe('image/png');
    expect(sniffImageType(bytes(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50))).toBe('image/webp');
  });

  it('rejects scripts and HTML disguised as images', () => {
    expect(sniffImageType(new TextEncoder().encode('<script>alert(1)</script>'))).toBeNull();
    expect(isValidUpload(new TextEncoder().encode('<svg onload=alert(1)>'))).toBe(false);
    expect(isValidUpload(new Uint8Array())).toBe(false);
  });
});
