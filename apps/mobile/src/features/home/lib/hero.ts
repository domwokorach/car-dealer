import type { VehicleSummary } from '@car-dealer/contracts';

export const MAX_FEATURED = 5;

/** Phones: tall portrait banner. Tablets: a wider, shorter banner so it does not fill the whole screen. */
export function heroHeight(width: number): number {
  const raw = width >= 700 ? width * 0.62 : width * 1.35;
  return Math.round(Math.min(Math.max(raw, 460), width >= 700 ? 560 : 640));
}

/** Widest the text column gets; on tablets it stays a readable block instead of spanning the banner. */
export const heroTextWidth = (width: number) => (width >= 700 ? 520 : width);

/** Slides worth showing: a real photo that has not failed to load, at most five, in the order the API gave them. */
export function selectSlides(items: VehicleSummary[], failedUrls: ReadonlySet<string>): VehicleSummary[] {
  return items.filter((v) => v.imageUrl !== null && !failedUrls.has(v.imageUrl)).slice(0, MAX_FEATURED);
}
