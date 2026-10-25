import { describe, expect, it } from 'vitest';
import { addMinutes, formatMileage, formatPence, isPast, slugify } from './index';

describe('utils', () => {
  it('formats pence as whole-pound currency', () => {
    expect(formatPence(4295000)).toBe('£42,950');
  });
  it('formats mileage', () => {
    expect(formatMileage(12500)).toBe('12,500 miles');
  });
  it('slugifies with accents and punctuation', () => {
    expect(slugify('  Série 3 — Touring!  ')).toBe('serie-3-touring');
  });
  it('adds minutes and detects past dates', () => {
    const base = new Date('2030-01-01T00:00:00Z');
    expect(addMinutes(base, 60).toISOString()).toBe('2030-01-01T01:00:00.000Z');
    expect(isPast(base, new Date('2030-01-02T00:00:00Z'))).toBe(true);
    expect(isPast(base, new Date('2029-12-31T00:00:00Z'))).toBe(false);
  });
});
