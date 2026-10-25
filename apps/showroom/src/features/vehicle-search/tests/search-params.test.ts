import { describe, expect, it } from 'vitest';
import { parseSearchParams } from '../schemas/search-params';

describe('parseSearchParams', () => {
  it('converts pounds to pence and keeps valid values', () => {
    const q = parseSearchParams({ min: '20000', max: '50000', fuel: 'ELECTRIC', sort: 'price_asc', page: '2' }, 'NEW');
    expect(q).toMatchObject({ condition: 'NEW', minPricePence: 2_000_000, maxPricePence: 5_000_000, fuelType: 'ELECTRIC', sort: 'price_asc', page: 2 });
  });

  it('drops malformed or hostile values', () => {
    const q = parseSearchParams({ min: '-5', max: 'abc', fuel: 'STEAM', sort: 'drop table', page: '0', branch: 'not-a-uuid' }, 'USED');
    expect(q).toMatchObject({ condition: 'USED', page: 1, sort: 'newest' });
    expect(q.minPricePence).toBeUndefined();
    expect(q.maxPricePence).toBeUndefined();
    expect(q.fuelType).toBeUndefined();
    expect(q.branchId).toBeUndefined();
  });
});
