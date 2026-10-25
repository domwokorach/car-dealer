import type { VehicleSummary } from '@car-dealer/contracts';
import { describe, expect, it } from 'vitest';
import { heroHeight, selectSlides } from './hero';

const car = (slug: string, imageUrl: string | null): VehicleSummary => ({
  listingId: '11111111-1111-4111-8111-111111111111',
  slug,
  title: slug,
  modelName: 'Model',
  variantName: 'Variant',
  condition: 'NEW',
  pricePence: 1,
  mileage: null,
  registrationYear: null,
  fuelType: 'PETROL',
  transmission: 'AUTOMATIC',
  colour: null,
  branchName: 'B',
  branchCity: 'C',
  available: true,
  imageUrl,
});

describe('heroHeight', () => {
  it('stays within sensible bounds on small phones, large phones and tablets', () => {
    expect(heroHeight(320)).toBe(460);
    expect(heroHeight(390)).toBe(527);
    expect(heroHeight(430)).toBe(581);
    expect(heroHeight(1024)).toBe(560);
    expect(heroHeight(768)).toBe(476);
  });
});

describe('selectSlides', () => {
  it('drops listings without a photo and photos that failed to load, and caps at five', () => {
    const items = [car('a', 'https://x/a.jpg'), car('b', null), car('c', 'https://x/c.jpg'), car('d', 'https://x/d.jpg'), car('e', 'https://x/e.jpg'), car('f', 'https://x/f.jpg'), car('g', 'https://x/g.jpg')];
    expect(selectSlides(items, new Set(['https://x/c.jpg'])).map((v) => v.slug)).toEqual(['a', 'd', 'e', 'f', 'g']);
    expect(selectSlides([car('b', null)], new Set())).toEqual([]);
  });
});
