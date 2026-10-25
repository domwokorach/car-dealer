import * as SecureStore from 'expo-secure-store';

/** Minimal key/value interface (also what supabase-js expects from an auth storage adapter). */
export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/** Keychain/Keystore values are size-limited (~2 KB). Supabase sessions are larger, so values are chunked. */
export const CHUNK_SIZE = 1800;

const countKey = (key: string) => `${key}.chunks`;
const chunkKey = (key: string, i: number) => `${key}.${i}`;

export function createChunkedStore(raw: KeyValueStore, chunkSize = CHUNK_SIZE): KeyValueStore {
  async function remove(key: string) {
    const count = Number((await raw.getItem(countKey(key))) ?? 0);
    for (let i = 0; i < count; i++) await raw.removeItem(chunkKey(key, i));
    await raw.removeItem(countKey(key));
  }

  return {
    async getItem(key) {
      const count = Number(await raw.getItem(countKey(key)));
      if (!Number.isInteger(count) || count <= 0) return null;
      const parts: string[] = [];
      for (let i = 0; i < count; i++) {
        const part = await raw.getItem(chunkKey(key, i));
        if (part === null) return null; // torn write: treat as signed out rather than returning corrupt JSON
        parts.push(part);
      }
      return parts.join('');
    },
    async setItem(key, value) {
      await remove(key);
      const chunks = value.match(new RegExp(`[\\s\\S]{1,${chunkSize}}`, 'g')) ?? [];
      for (let i = 0; i < chunks.length; i++) await raw.setItem(chunkKey(key, i), chunks[i]!);
      await raw.setItem(countKey(key), String(chunks.length));
    },
    removeItem: remove,
  };
}

const nativeStore: KeyValueStore = {
  getItem: (k) => SecureStore.getItemAsync(k),
  setItem: (k, v) => SecureStore.setItemAsync(k, v),
  removeItem: (k) => SecureStore.deleteItemAsync(k),
};

export const secureStorage = createChunkedStore(nativeStore);
