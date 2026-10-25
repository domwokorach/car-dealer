import { describe, expect, it } from 'vitest';
import { safeRedirectPath } from './safe-redirect';

describe('safeRedirectPath', () => {
  it('keeps same-site paths', () => {
    expect(safeRedirectPath('/inventory?x=1')).toBe('/inventory?x=1');
  });
  it.each(['https://evil.test', '//evil.test', '/\\evil.test', '', null, undefined, 'javascript:alert(1)'])(
    'rejects %s',
    (input) => {
      expect(safeRedirectPath(input)).toBe('/dashboard');
    },
  );
});
