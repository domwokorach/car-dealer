import { describe, expect, it } from 'vitest';
import { moveItem, nextToUpload, remainingSlots, uploadReducer, type UploadItem } from './upload-queue';

const item = (id: string, status: UploadItem['status'] = 'queued', extra: Partial<UploadItem> = {}): UploadItem => ({
  id,
  uri: `file:///${id}.jpg`,
  status,
  ...extra,
});

describe('uploadReducer', () => {
  it('moves an item through queued → uploading → error → retry → done', () => {
    let s = uploadReducer([], { type: 'add', items: [item('a')] });
    s = uploadReducer(s, { type: 'start', id: 'a' });
    expect(s[0]?.status).toBe('uploading');
    s = uploadReducer(s, { type: 'fail', id: 'a', error: 'offline' });
    expect(s[0]).toMatchObject({ status: 'error', error: 'offline' });
    s = uploadReducer(s, { type: 'retry', id: 'a' });
    expect(s[0]).toMatchObject({ status: 'queued', error: undefined });
    s = uploadReducer(s, { type: 'done', id: 'a' });
    expect(s[0]?.status).toBe('done');
  });

  it('will not discard an upload that is in flight, but discards failed and queued ones', () => {
    const s = [item('a', 'uploading'), item('b', 'error'), item('c')];
    expect(uploadReducer(s, { type: 'discard', id: 'a' }).map((i) => i.id)).toEqual(['a', 'b', 'c']);
    expect(uploadReducer(s, { type: 'discard', id: 'b' }).map((i) => i.id)).toEqual(['a', 'c']);
  });

  it('clears completed uploads only', () => {
    expect(uploadReducer([item('a', 'done'), item('b', 'error')], { type: 'clearDone' }).map((i) => i.id)).toEqual(['b']);
  });
});

describe('remainingSlots', () => {
  it('counts stored photos and pending adds, but not replacements, failures or finished uploads', () => {
    const items = [item('a'), item('b', 'uploading'), item('c', 'done'), item('d', 'error'), item('e', 'queued', { replaceImageId: 'x' })];
    expect(remainingSlots(10, items)).toBe(8);
  });

  it('never goes negative', () => {
    expect(remainingSlots(25, [item('a')])).toBe(0);
  });
});

describe('nextToUpload', () => {
  it('runs one upload at a time, in order', () => {
    expect(nextToUpload([item('a'), item('b')])?.id).toBe('a');
    expect(nextToUpload([item('a', 'uploading'), item('b')])).toBeUndefined();
    expect(nextToUpload([item('a', 'error'), item('b', 'done')])).toBeUndefined();
  });
});

describe('moveItem', () => {
  it('swaps neighbours and ignores moves past either end', () => {
    expect(moveItem(['a', 'b', 'c'], 1, -1)).toEqual(['b', 'a', 'c']);
    expect(moveItem(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'c', 'b']);
    const list = ['a', 'b'];
    expect(moveItem(list, 0, -1)).toBe(list);
    expect(moveItem(list, 1, 1)).toBe(list);
  });
});
