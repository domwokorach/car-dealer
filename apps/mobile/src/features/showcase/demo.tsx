import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui';
import { spacing } from '@/theme';

/** One labelled example in the showcase. */
export function Demo({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <View className="rounded-xl border border-border bg-card" style={{ padding: spacing.lg, gap: spacing.md }}>
      <View style={{ gap: 2 }}>
        <Text variant="heading">{title}</Text>
        {note ? <Text variant="caption" tone="muted">{note}</Text> : null}
      </View>
      {children}
    </View>
  );
}
