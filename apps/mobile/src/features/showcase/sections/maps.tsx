import { useState } from 'react';
import { Map as PanelMap } from '@/components/panel/map';
import { Text } from '@/components/ui';
import { mapSource, usingDefaultTiles } from '@/features/locations/map-source';
import { Demo } from '../demo';

const LONDON: [number, number] = [-0.1276, 51.5072];
const POINTS = [
  { id: 'a', name: 'Central showroom', at: [-0.1276, 51.5072] as [number, number] },
  { id: 'b', name: 'East branch', at: [-0.0235, 51.5235] as [number, number] },
];

export function Maps() {
  const [selected, setSelected] = useState<string>();
  return (
    <Demo title="Map + Marker + Popup" note={usingDefaultTiles ? 'Sample points, native MapLibre. Uses CARTO dev tiles: set EXPO_PUBLIC_MAP_TILES_URL for production.' : 'Sample points, native MapLibre.'}>
      <PanelMap source={mapSource} center={LONDON} zoom={10.5} style={{ height: 320 }}>
        {POINTS.map((p) => (
          <PanelMap.Marker key={p.id} lngLat={p.at} accessibilityLabel={p.name} onPress={() => setSelected(p.id)}>
            {selected === p.id ? <PanelMap.Popup title={p.name}><Text variant="caption" tone="muted">Tap another marker to switch.</Text></PanelMap.Popup> : null}
          </PanelMap.Marker>
        ))}
        <PanelMap.Controls zoom locate />
      </PanelMap>
    </Demo>
  );
}
