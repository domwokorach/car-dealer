import { describe, expect, it } from 'vitest';
import { safeRedirectPath } from './safe-redirect';

describe('safeRedirectPath', () => {
  it('keeps same-site paths', () => {
    expect(safeRedirectPath('/cars/aurora?x=1')).toBe('/cars/aurora?x=1');
  });
  it.each(['https://evil.test', '//evil.test', '/\\evil.test', '', null, undefined, 'javascript:alert(1)'])(
    'rejects %s',
    (input) => {
      expect(safeRedirectPath(input)).toBe('/account');
    },
  );
});
