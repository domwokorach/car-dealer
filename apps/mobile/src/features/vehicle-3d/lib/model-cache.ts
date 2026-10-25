import * as FileSystem from 'expo-file-system/legacy';

/** Models kept on disk. A signed URL expires, but a model's id never changes, so the id is the cache key. */
const KEEP = 3;
const DIR = `${FileSystem.cacheDirectory ?? ''}vehicle-models/`;

export class DownloadCancelled extends Error {
  constructor() {
    super('Download cancelled');
    this.name = 'DownloadCancelled';
  }
}

export interface ModelDownload {
  /** Resolves with the local file URI. Rejects with DownloadCancelled after `cancel()`. */
  promise: Promise<string>;
  cancel: () => void;
}

export const cachedPath = (id: string) => `${DIR}${id}.glb`;

/**
 * Fetches a model into the cache with progress and cancellation. The file is written to `.part` first and only
 * renamed when complete, so an interrupted download can never be mistaken for a model. A cached copy is trusted
 * only if its size matches what the API says it should be.
 */
export function downloadModel(model: { id: string; url: string; sizeBytes: number }, onProgress: (fraction: number) => void): ModelDownload {
  let cancelled = false;
  let resumable: FileSystem.DownloadResumable | null = null;

  const run = async (): Promise<string> => {
    await FileSystem.makeDirectoryAsync(DIR, { intermediates: true }).catch(() => undefined);
    const target = cachedPath(model.id);
    const existing = await FileSystem.getInfoAsync(target);
    if (existing.exists && existing.size === model.sizeBytes) {
      onProgress(1);
      return target;
    }
    if (existing.exists) await FileSystem.deleteAsync(target, { idempotent: true });

    const partial = `${target}.part`;
    await FileSystem.deleteAsync(partial, { idempotent: true });
    if (cancelled) throw new DownloadCancelled();
    resumable = FileSystem.createDownloadResumable(model.url, partial, {}, ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
      const total = totalBytesExpectedToWrite > 0 ? totalBytesExpectedToWrite : model.sizeBytes;
      onProgress(Math.min(1, totalBytesWritten / total));
    });
    let result: Awaited<ReturnType<FileSystem.DownloadResumable['downloadAsync']>>;
    try {
      result = await resumable.downloadAsync();
    } catch (err) {
      await FileSystem.deleteAsync(partial, { idempotent: true });
      if (cancelled) throw new DownloadCancelled();
      throw err;
    }
    if (cancelled) {
      await FileSystem.deleteAsync(partial, { idempotent: true });
      throw new DownloadCancelled();
    }
    if (!result || result.status !== 200) {
      await FileSystem.deleteAsync(partial, { idempotent: true });
      throw new Error(result?.status === 403 || result?.status === 400 ? 'The 3D model link has expired. Please try again.' : 'The 3D model could not be downloaded.');
    }
    const written = await FileSystem.getInfoAsync(partial);
    if (!written.exists || written.size !== model.sizeBytes) {
      await FileSystem.deleteAsync(partial, { idempotent: true });
      throw new Error('The 3D model download was incomplete. Please try again.');
    }
    await FileSystem.moveAsync({ from: partial, to: target });
    void pruneModelCache(model.id);
    return target;
  };

  return {
    promise: run(),
    cancel: () => {
      cancelled = true;
      void resumable?.pauseAsync().catch(() => undefined);
    },
  };
}

/** Keeps the most recently written models (always including `keepId`) and removes the rest, and any stray `.part`. */
export async function pruneModelCache(keepId: string): Promise<void> {
  try {
    const names = await FileSystem.readDirectoryAsync(DIR);
    const entries = await Promise.all(
      names.map(async (name) => {
        const info = await FileSystem.getInfoAsync(`${DIR}${name}`);
        return { name, modified: info.exists ? (info.modificationTime ?? 0) : 0 };
      }),
    );
    const done = entries.filter((e) => e.name.endsWith('.glb')).sort((a, b) => b.modified - a.modified);
    const keep = new Set([`${keepId}.glb`, ...done.slice(0, KEEP).map((e) => e.name)]);
    for (const e of entries) {
      if (!keep.has(e.name)) await FileSystem.deleteAsync(`${DIR}${e.name}`, { idempotent: true });
    }
  } catch {
    // Cache housekeeping must never surface as an error to the person looking at a car.
  }
}
