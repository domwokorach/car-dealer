import { Pressable } from 'react-native';
import { Text } from './text';

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      className={`rounded-full border px-4 py-2.5 ${selected ? 'border-primary bg-primary' : 'border-border bg-card'}`}
    >
      <Text variant="caption" className={selected ? 'text-primary-foreground' : undefined} style={{ fontWeight: '500' }}>
        {label}
      </Text>
    </Pressable>
  );
}
