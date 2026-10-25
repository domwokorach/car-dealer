import { randomUUID } from 'expo-crypto';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { uploadToSignedUrl } from '@car-dealer/api-client';
import { getApi } from '@/services/api';
import { useRefreshAfter } from '../api/mutations';
import { prepareImage } from '../lib/prepare-image';
import { nextToUpload, remainingSlots, uploadReducer, type UploadItem } from '../lib/upload-queue';

const PICKER: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1, exif: false };

/**
 * Photo picking and uploading for one vehicle. Uploads run one at a time: compress → request a signed slot →
 * send the bytes → ask the server to verify and publish. Failures stay in the list so they can be retried.
 */
export function usePhotoUploads(vehicleId: string, storedCount: number) {
  const [items, dispatch] = useReducer(uploadReducer, [] as UploadItem[]);
  const [notice, setNotice] = useState<string>();
  const refresh = useRefreshAfter(vehicleId);
  const mounted = useRef(true);
  useEffect(() => () => void (mounted.current = false), []);

  const enqueue = useCallback(
    (assets: ImagePicker.ImagePickerAsset[], replaceImageId?: string) => {
      const room = replaceImageId ? 1 : remainingSlots(storedCount, items);
      const accepted = assets.slice(0, room);
      if (assets.length > accepted.length) {
        setNotice(room === 0 ? 'This vehicle already has the maximum of 20 photos.' : `Only ${room} more photo${room === 1 ? '' : 's'} fit; the rest were skipped.`);
      } else setNotice(undefined);
      dispatch({
        type: 'add',
        items: accepted.map((a) => ({ id: randomUUID(), uri: a.uri, status: 'queued' as const, replaceImageId })),
      });
    },
    [items, storedCount],
  );

  const pickFromGallery = useCallback(
    async (replaceImageId?: string) => {
      const result = await ImagePicker.launchImageLibraryAsync({
        ...PICKER,
        allowsMultipleSelection: !replaceImageId,
        selectionLimit: replaceImageId ? 1 : Math.max(1, remainingSlots(storedCount, items)),
        orderedSelection: true,
      });
      if (!result.canceled) enqueue(result.assets, replaceImageId);
    },
    [enqueue, items, storedCount],
  );

  const takePhoto = useCallback(
    async (replaceImageId?: string) => {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setNotice(
          permission.canAskAgain
            ? 'Camera access was declined. Allow it to take photos.'
            : 'Camera access is turned off. Enable it for this app in your device Settings, or choose from your gallery instead.',
        );
        return;
      }
      const result = await ImagePicker.launchCameraAsync(PICKER);
      if (!result.canceled) enqueue(result.assets, replaceImageId);
    },
    [enqueue],
  );

  const next = nextToUpload(items);
  useEffect(() => {
    if (!next) return;
    const item = next;
    dispatch({ type: 'start', id: item.id });
    void (async () => {
      try {
        const asset = await prepareImage(item.uri);
        const api = getApi();
        const target = await api.media.requestUpload({
          stockVehicleId: vehicleId,
          contentType: asset.contentType,
          sizeBytes: asset.sizeBytes,
          replaceImageId: item.replaceImageId,
        });
        const blob = await (await fetch(asset.uri)).blob();
        await uploadToSignedUrl(target.uploadUrl, blob, asset.contentType);
        await api.media.confirmUpload({
          stockVehicleId: vehicleId,
          storagePath: target.storagePath,
          altText: null,
          replaceImageId: item.replaceImageId,
        });
        if (mounted.current) dispatch({ type: 'done', id: item.id });
        refresh();
      } catch (error) {
        if (mounted.current) dispatch({ type: 'fail', id: item.id, error: error instanceof Error ? error.message : 'Upload failed' });
      }
    })();
    // `next` identity changes only when the queue head changes; the effect must not re-run for the same item.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [next?.id]);

  return {
    items,
    notice,
    busy: items.some((i) => i.status === 'queued' || i.status === 'uploading'),
    slotsLeft: remainingSlots(storedCount, items),
    pickFromGallery,
    takePhoto,
    retry: (id: string) => dispatch({ type: 'retry', id }),
    discard: (id: string) => dispatch({ type: 'discard', id }),
    clearDone: () => dispatch({ type: 'clearDone' }),
  };
}
