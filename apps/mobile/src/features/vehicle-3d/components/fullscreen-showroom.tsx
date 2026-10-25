import type { ReactNode } from 'react';
import { Modal, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HudButton } from './car-3d-controls';

/**
 * Full-screen black-studio container. A React Native Modal is a separate native root, so it needs its own
 * GestureHandlerRootView or drag/pinch silently do nothing on Android.
 */
export function FullscreenShowroom({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="fade" presentationStyle="fullScreen" supportedOrientations={['portrait', 'landscape']} onRequestClose={onClose} statusBarTranslucent>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#0a0b0e' }}>
        <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom, paddingLeft: insets.left, paddingRight: insets.right }}>{children}</View>
        <View pointerEvents="box-none" style={{ position: 'absolute', top: insets.top + 12, left: insets.left + 12 }}>
          <HudButton label="‹ Back" accessibilityLabel="Close the full-screen showroom" onPress={onClose} />
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
