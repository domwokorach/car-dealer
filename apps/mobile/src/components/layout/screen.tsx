import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '@/theme';

/** Standard screen: themed background, safe-area padding, optional scrolling and pull-to-refresh. */
export function Screen({
  children,
  scroll = true,
  scrollEnabled = true,
  padded = true,
  onRefresh,
  refreshing = false,
  contentStyle,
  footer,
}: {
  children: ReactNode;
  scroll?: boolean;
  /** False while a child owns the touch (a 3D viewer being turned), so the page does not scroll underneath it. */
  scrollEnabled?: boolean;
  padded?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  footer?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const padding = padded ? spacing.lg : 0;
  return (
    <View className="flex-1 bg-background">
      {scroll ? (
        <ScrollView
          scrollEnabled={scrollEnabled}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={[{ padding, paddingBottom: padding + (footer ? 0 : insets.bottom), gap: spacing.lg }, contentStyle]}
          refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1, padding }, contentStyle]}>{children}</View>
      )}
      {footer ? (
        <View className="border-t border-border bg-background" style={{ padding: spacing.lg, paddingBottom: spacing.lg + insets.bottom }}>
          {footer}
        </View>
      ) : null}
    </View>
  );
}
