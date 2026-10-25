import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PanelUIProvider } from '@/components/panel/panel-ui-provider';
import { AuthProvider } from './auth-provider';
import { QueryProvider } from './query-provider';

/** The single PanelUIProvider lives here: it owns the gesture root, themed background and the portal host for overlays. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SafeAreaProvider>
      <PanelUIProvider>
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </PanelUIProvider>
    </SafeAreaProvider>
  );
}
