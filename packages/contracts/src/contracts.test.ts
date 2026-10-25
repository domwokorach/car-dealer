import { describe, expect, it } from 'vitest';
import { CreateStockVehicleSchema, ListVehiclesQuerySchema, ROLES } from './index';

describe('contracts', () => {
  it('coerces and defaults list query params', () => {
    const q = ListVehiclesQuerySchema.parse({ page: '2', condition: 'USED' });
    expect(q).toMatchObject({ page: 2, pageSize: 20, condition: 'USED', sort: 'newest' });
  });

  it('rejects VINs containing I, O or Q', () => {
    const base = {
      branchId: crypto.randomUUID(),
      variantId: crypto.randomUUID(),
      condition: 'NEW',
      askingPricePence: 100,
    };
    expect(CreateStockVehicleSchema.safeParse({ ...base, vin: 'WDD1234561A123456' }).success).toBe(true);
    expect(CreateStockVehicleSchema.safeParse({ ...base, vin: 'WDD1234561A12345O' }).success).toBe(false);
  });

  it('exposes the five platform roles', () => {
    expect(ROLES).toHaveLength(5);
  });
});
