import { describe, expect, it } from 'vitest';
import { humanise } from './format';

describe('humanise', () => {
  it('turns enum values into readable labels', () => {
    expect(humanise('PLUG_IN_HYBRID')).toBe('Plug in hybrid');
    expect(humanise('NEW')).toBe('New');
  });
});
