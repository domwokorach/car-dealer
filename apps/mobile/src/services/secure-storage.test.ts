import { describe, expect, it, vi } from 'vitest';
import { createChunkedStore, type KeyValueStore } from './secure-storage';

// vi.mock is hoisted above imports; the native module is irrelevant to the pure chunking logic.
vi.mock('expo-secure-store', () => ({}));

function memory(): KeyValueStore & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: async (k) => data.get(k) ?? null,
    setItem: async (k, v) => void data.set(k, v),
    removeItem: async (k) => void data.delete(k),
  };
}

describe('chunked secure storage', () => {
  it('round-trips values larger than one chunk without exceeding the chunk size', async () => {
    const raw = memory();
    const store = createChunkedStore(raw, 10);
    const value = JSON.stringify({ access_token: 'x'.repeat(95) });
    await store.setItem('session', value);
    expect(await store.getItem('session')).toBe(value);
    expect([...raw.data.entries()].filter(([k]) => !k.endsWith('.chunks')).every(([, v]) => v.length <= 10)).toBe(true);
  });

  it('removes stale chunks when a shorter value replaces a longer one', async () => {
    const raw = memory();
    const store = createChunkedStore(raw, 5);
    await store.setItem('k', 'a'.repeat(30));
    await store.setItem('k', 'bb');
    expect(await store.getItem('k')).toBe('bb');
    expect(raw.data.size).toBe(2); // one chunk + the count
  });

  it('returns null for missing keys and torn writes, and clears on remove', async () => {
    const raw = memory();
    const store = createChunkedStore(raw, 5);
    expect(await store.getItem('nope')).toBeNull();
    await store.setItem('k', 'hello world');
    raw.data.delete('k.1');
    expect(await store.getItem('k')).toBeNull();
    await store.removeItem('k');
    expect(raw.data.size).toBe(0);
  });
});
