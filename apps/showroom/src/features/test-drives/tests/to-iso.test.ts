import { describe, expect, it } from 'vitest';
import { localInputToIso } from '../utils/to-iso';

describe('localInputToIso', () => {
  it('returns an ISO instant for a valid local value', () => {
    expect(localInputToIso('2030-05-01T10:30')).toMatch(/^2030-05-01T\d{2}:30:00\.000Z$/);
  });
  it('returns null for empty or invalid input', () => {
    expect(localInputToIso('')).toBeNull();
    expect(localInputToIso('garbage')).toBeNull();
  });
});
