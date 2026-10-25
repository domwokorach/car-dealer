import { describe, expect, it } from 'vitest';
import { isLoopbackUrl, resolveApiUrl } from './api-url';

const base = { platform: 'ios', isDev: true } as const;

describe('resolveApiUrl', () => {
  it('prefers the configured URL and trims trailing slashes', () => {
    expect(resolveApiUrl({ ...base, configured: 'https://api.example.com//', hostUri: '192.168.1.5:8081' })).toEqual({
      ok: true,
      url: 'https://api.example.com',
      source: 'env',
    });
  });

  it('derives the API from the Metro LAN host in development', () => {
    expect(resolveApiUrl({ ...base, hostUri: '192.168.1.20:8081' })).toEqual({
      ok: true,
      url: 'http://192.168.1.20:4000',
      source: 'metro-host',
    });
  });

  it('maps a loopback Metro host to 10.0.2.2 on Android only', () => {
    expect(resolveApiUrl({ platform: 'android', isDev: true, hostUri: 'localhost:8081' })).toMatchObject({ url: 'http://10.0.2.2:4000' });
    expect(resolveApiUrl({ platform: 'ios', isDev: true, hostUri: 'localhost:8081' })).toMatchObject({ url: 'http://localhost:4000' });
  });

  it('refuses to guess in tunnel mode or production', () => {
    expect(resolveApiUrl({ ...base, hostUri: 'abc-123.exp.direct:80' })).toMatchObject({ ok: false });
    expect(resolveApiUrl({ platform: 'ios', isDev: false, hostUri: '192.168.1.20:8081' })).toMatchObject({ ok: false });
    expect(resolveApiUrl({ ...base })).toMatchObject({ ok: false });
  });
});

describe('isLoopbackUrl', () => {
  it('detects URLs a physical phone cannot use', () => {
    expect(isLoopbackUrl('http://localhost:4000')).toBe(true);
    expect(isLoopbackUrl('http://127.0.0.1:4000')).toBe(true);
    expect(isLoopbackUrl('http://192.168.1.20:4000')).toBe(false);
    expect(isLoopbackUrl('not a url')).toBe(false);
  });
});
