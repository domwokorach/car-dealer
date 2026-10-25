import { describe, expect, it } from 'vitest';
import { activeFilterCount, toQuery } from './filters';

describe('filters', () => {
  it('converts pounds to pence and drops unset values', () => {
    expect(toQuery({ sort: 'price_asc', maxPricePounds: 50_000, condition: 'NEW' }, 2)).toMatchObject({
      maxPricePence: 5_000_000,
      condition: 'NEW',
      page: 2,
      pageSize: 12,
      sort: 'price_asc',
    });
  });
  it('counts active filters (sort is not a filter)', () => {
    expect(activeFilterCount({ sort: 'newest' })).toBe(0);
    expect(activeFilterCount({ sort: 'newest', condition: 'USED', fuelType: 'ELECTRIC' })).toBe(2);
  });
});
