import type { SearchParams } from '@/types/search-params';

/** Build a href for another page, preserving the active filters. */
export function pageHref(basePath: string, params: SearchParams, page: number): string {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const v = Array.isArray(value) ? value[0] : value;
    if (v && key !== 'page') next.set(key, v);
  }
  if (page > 1) next.set('page', String(page));
  const qs = next.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}
