import { CARTO_SOURCE, type BasemapSource } from '@/components/panel/basemap';

/**
 * Vector tile source for every map in the app (OpenMapTiles schema).
 *
 * CARTO's free tiles are for non-commercial use only. Before shipping, point these at a licensed provider
 * (MapTiler, Stadia, Protomaps, self-hosted…): EXPO_PUBLIC_MAP_TILES_URL (TileJSON), EXPO_PUBLIC_MAP_GLYPHS_URL
 * (`{fontstack}/{range}` template) and optionally EXPO_PUBLIC_MAP_FONT / EXPO_PUBLIC_MAP_ATTRIBUTION.
 */
const url = process.env.EXPO_PUBLIC_MAP_TILES_URL;
const glyphs = process.env.EXPO_PUBLIC_MAP_GLYPHS_URL;

export const mapSource: BasemapSource =
  url && glyphs
    ? {
        url,
        glyphs,
        fonts: [process.env.EXPO_PUBLIC_MAP_FONT ?? 'Noto Sans Regular'],
        ...(process.env.EXPO_PUBLIC_MAP_ATTRIBUTION ? { attribution: process.env.EXPO_PUBLIC_MAP_ATTRIBUTION } : {}),
      }
    : CARTO_SOURCE;

export const usingDefaultTiles = mapSource === CARTO_SOURCE;
