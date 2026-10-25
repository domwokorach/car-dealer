import type { Branch } from '@car-dealer/contracts';
import { useMemo } from 'react';
import { View } from 'react-native';
import { Map as PanelMap } from '@/components/panel/map';
import type { LngLat, LngLatBounds } from '@/components/panel/maplibre';
import { Text } from '@/components/ui';
import { mapSource } from '../map-source';
import { branchAddress } from '../api/coordinates';

// Centre of Great Britain; only used when no branch could be placed.
const UK_CENTRE: LngLat = [-2.5, 54];

function boundsOf(points: LngLat[]): LngLatBounds | undefined {
  if (points.length < 2) return undefined;
  const lngs = points.map((p) => p[0]);
  const lats = points.map((p) => p[1]);
  return [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)];
}

export interface BranchMapProps {
  branches: Branch[];
  coordinates: Map<string, LngLat | null>;
  selectedId?: string | undefined;
  onSelect?: ((branch: Branch) => void) | undefined;
  /** Shows the "locate me" control. Location permission is only requested when it is pressed. */
  locate?: boolean;
  interactive?: boolean;
  height?: number;
}

/** MapLibre map with one marker per branch that has coordinates. Branches without coordinates are listed, not drawn. */
export function BranchMap({ branches, coordinates, selectedId, onSelect, locate = true, interactive = true, height = 320 }: BranchMapProps) {
  const placed = useMemo(
    () => branches.flatMap((b) => { const at = coordinates.get(b.id); return at ? [{ branch: b, at }] : []; }),
    [branches, coordinates],
  );
  const unplaced = branches.length - placed.length;
  const bounds = boundsOf(placed.map((p) => p.at));
  const only = placed.length === 1 ? placed[0] : undefined;

  return (
    <View className="overflow-hidden rounded-xl border border-border" style={{ height }}>
      <PanelMap
        source={mapSource}
        interactive={interactive}
        {...(bounds ? { bounds } : { center: only?.at ?? UK_CENTRE, zoom: only ? 13 : 4.5 })}
        accessibilityLabel={`Map of ${placed.length} dealership${placed.length === 1 ? '' : 's'}`}
      >
        {placed.map(({ branch, at }) => (
          <PanelMap.Marker
            key={branch.id}
            lngLat={at}
            accessibilityLabel={`${branch.name}, ${branch.city}`}
            onPress={() => onSelect?.(branch)}
          >
            {selectedId === branch.id ? (
              <PanelMap.Popup title={branch.name}>
                <Text variant="caption" tone="muted">
                  {branchAddress(branch).replace(', United Kingdom', '')}
                </Text>
                {branch.phone ? <Text variant="caption">{branch.phone}</Text> : null}
              </PanelMap.Popup>
            ) : null}
          </PanelMap.Marker>
        ))}
        {locate ? <PanelMap.Controls zoom locate position="top-right" /> : null}
      </PanelMap>
      {unplaced > 0 ? (
        <View className="absolute bottom-2 left-2 right-2 rounded-lg bg-popover px-3 py-2">
          <Text variant="caption" tone="muted">
            {placed.length === 0 ? 'Locations couldn’t be placed on the map.' : `${unplaced} branch${unplaced === 1 ? '' : 'es'} couldn’t be placed on the map.`} Use the list for addresses and directions.
          </Text>
        </View>
      ) : null}
    </View>
  );
}
