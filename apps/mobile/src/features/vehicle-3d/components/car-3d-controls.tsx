import { VIEW_PRESETS, type ViewPresetId } from '@car-dealer/utils';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from '@/components/ui';

/** Controls float over an always-dark studio, so they are always-dark too (like the home hero), in both themes. */
function HudButton({ label, onPress, selected, accessibilityLabel }: { label: string; onPress: () => void; selected?: boolean; accessibilityLabel?: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={selected === undefined ? undefined : { selected }}
      hitSlop={6}
      style={({ pressed }) => ({
        minHeight: 36,
        paddingHorizontal: 14,
        borderRadius: 18,
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: selected ? '#00A1DE' : 'rgba(255,255,255,0.22)',
        backgroundColor: pressed ? 'rgba(255,255,255,0.24)' : selected ? 'rgba(0,161,222,0.28)' : 'rgba(10,11,13,0.62)',
      })}
    >
      <Text variant="caption" tone="inverse" style={{ fontWeight: '600' }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Car3DControls({
  autoRotate,
  onToggleAutoRotate,
  onPreset,
  fullscreen,
  onToggleFullscreen,
  showAutoRotate = true,
}: {
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
  onPreset: (id: ViewPresetId) => void;
  fullscreen: boolean;
  onToggleFullscreen?: () => void;
  showAutoRotate?: boolean;
}) {
  return (
    <>
      <View pointerEvents="box-none" style={{ position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
        {showAutoRotate ? (
          <HudButton
            label={autoRotate ? 'Pause' : 'Auto rotate'}
            accessibilityLabel={autoRotate ? 'Pause automatic rotation' : 'Start automatic rotation'}
            onPress={onToggleAutoRotate}
            selected={autoRotate}
          />
        ) : null}
        <HudButton label="Reset view" onPress={() => onPreset('reset')} />
        {onToggleFullscreen ? (
          <HudButton label={fullscreen ? 'Close' : 'Full screen'} accessibilityLabel={fullscreen ? 'Leave full screen' : 'Open full-screen showroom'} onPress={onToggleFullscreen} />
        ) : null}
      </View>
      <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: 12 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }} keyboardShouldPersistTaps="handled">
          {VIEW_PRESETS.map((p) => (
            <HudButton key={p.id} label={p.label} accessibilityLabel={`${p.label} view`} onPress={() => onPreset(p.id)} />
          ))}
        </ScrollView>
      </View>
    </>
  );
}

export { HudButton };
