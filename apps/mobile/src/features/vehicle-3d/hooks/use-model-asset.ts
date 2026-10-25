import type { PublicVehicleModel } from '@car-dealer/contracts';
import { useCallback, useEffect, useState } from 'react';
import { downloadModel } from '../lib/model-cache';
import { loadGlbFromFile } from '../lib/parse-glb';
import { disposeObject, type PreparedModel } from '../lib/scene-utils';

export type ModelAssetState =
  | { phase: 'idle' }
  | { phase: 'downloading'; progress: number }
  | { phase: 'preparing' }
  | { phase: 'ready'; model: PreparedModel }
  | { phase: 'error'; message: string };

const MAX_ANISOTROPY = 4;

/**
 * Downloads (or reuses the cached copy of) a model and parses it into a scene, while `enabled`.
 * Turning `enabled` off, or unmounting, cancels an unfinished download and frees everything already built, so a
 * hidden viewer holds no network, CPU or GPU memory.
 */
export function useModelAsset(model: PublicVehicleModel | null | undefined, enabled: boolean) {
  const [slot, setSlot] = useState<{ key: string; state: ModelAssetState } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  const id = model?.id;
  const url = model?.url;
  const sizeBytes = model?.sizeBytes;
  // The state belongs to one (model, attempt). A different key, or being disabled, reads as a fresh start without
  // any state being reset inside an effect.
  const key = enabled && id && url && sizeBytes !== undefined ? `${id}:${attempt}` : null;

  useEffect(() => {
    if (!key || !id || !url || sizeBytes === undefined) return;
    let live = true;
    let built: PreparedModel | null = null;
    const publish = (state: ModelAssetState) => {
      if (live) setSlot({ key, state });
    };

    let lastReported = 0;
    const download = downloadModel({ id, url, sizeBytes }, (fraction) => {
      // Progress events are frequent; only a visible change is worth a render.
      if (fraction - lastReported >= 0.02 || fraction === 1) {
        lastReported = fraction;
        publish({ phase: 'downloading', progress: fraction });
      }
    });

    download.promise
      .then(async (uri) => {
        if (!live) return;
        publish({ phase: 'preparing' });
        const prepared = await loadGlbFromFile(uri, MAX_ANISOTROPY);
        if (!live) {
          disposeObject(prepared.root);
          return;
        }
        built = prepared;
        publish({ phase: 'ready', model: prepared });
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === 'DownloadCancelled') return;
        publish({ phase: 'error', message: err instanceof Error && err.message ? err.message : 'The 3D model could not be loaded.' });
      });

    return () => {
      live = false;
      download.cancel();
      if (built) disposeObject(built.root);
    };
  }, [key, id, url, sizeBytes]);

  const state: ModelAssetState = key === null ? { phase: 'idle' } : slot?.key === key ? slot.state : { phase: 'downloading', progress: 0 };
  return { state, retry };
}
