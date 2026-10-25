import { MAX_IMAGES_PER_VEHICLE } from '@car-dealer/contracts';

export type UploadStatus = 'queued' | 'uploading' | 'done' | 'error';

export interface UploadItem {
  id: string;
  /** Local file URI, shown as the preview while the upload runs. */
  uri: string;
  status: UploadStatus;
  error?: string;
  /** Set when this upload replaces an existing photo rather than adding one. */
  replaceImageId?: string;
}

export type UploadAction =
  | { type: 'add'; items: UploadItem[] }
  | { type: 'start'; id: string }
  | { type: 'done'; id: string }
  | { type: 'fail'; id: string; error: string }
  | { type: 'retry'; id: string }
  | { type: 'discard'; id: string }
  | { type: 'clearDone' };

const patch = (items: UploadItem[], id: string, change: Partial<UploadItem>) =>
  items.map((i) => (i.id === id ? { ...i, ...change } : i));

export function uploadReducer(items: UploadItem[], action: UploadAction): UploadItem[] {
  switch (action.type) {
    case 'add':
      return [...items, ...action.items];
    case 'start':
      return patch(items, action.id, { status: 'uploading', error: undefined });
    case 'done':
      return patch(items, action.id, { status: 'done', error: undefined });
    case 'fail':
      return patch(items, action.id, { status: 'error', error: action.error });
    case 'retry':
      return patch(items, action.id, { status: 'queued', error: undefined });
    case 'discard':
      // An upload already in flight cannot be cancelled mid-request; it is only removable once it has settled.
      return items.filter((i) => i.id !== action.id || i.status === 'uploading');
    case 'clearDone':
      return items.filter((i) => i.status !== 'done');
  }
}

/** How many more photos can be added: stored photos plus uploads that will add (not replace) one. */
export function remainingSlots(storedCount: number, items: UploadItem[]): number {
  const pendingAdds = items.filter((i) => !i.replaceImageId && i.status !== 'done' && i.status !== 'error').length;
  return Math.max(0, MAX_IMAGES_PER_VEHICLE - storedCount - pendingAdds);
}

/** The next upload to run, or undefined when one is already running or nothing is waiting. Uploads run one at a time. */
export function nextToUpload(items: UploadItem[]): UploadItem | undefined {
  if (items.some((i) => i.status === 'uploading')) return undefined;
  return items.find((i) => i.status === 'queued');
}

/** Moves one item by `offset` places, clamped to the ends. Returns the same array when nothing moves. */
export function moveItem<T>(list: T[], index: number, offset: -1 | 1): T[] {
  const target = index + offset;
  if (index < 0 || index >= list.length || target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target]!, next[index]!];
  return next;
}
