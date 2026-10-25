import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProviders } from '@/providers/app-providers';
import { useColors } from '@/theme';

function ThemedStack() {
  const c = useColors();
  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: c.background },
          headerTintColor: c.foreground,
          headerTitleStyle: { fontWeight: '300' },
          headerShadowVisible: false,
          headerBackTitle: 'Back',
          contentStyle: { backgroundColor: c.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="cars/[slug]" options={{ title: '' }} />
        <Stack.Screen name="branches/index" options={{ title: 'Our branches' }} />
        <Stack.Screen name="branches/[slug]" options={{ title: 'Branch' }} />
        <Stack.Screen name="compare" options={{ title: 'Compare cars' }} />
        <Stack.Screen name="support" options={{ title: 'Support' }} />
        <Stack.Screen name="enquiry/[vehicleId]" options={{ title: 'Enquire', presentation: 'modal' }} />
        <Stack.Screen name="test-drive/[vehicleId]" options={{ title: 'Book a test drive', presentation: 'modal' }} />
        <Stack.Screen name="reservation/[vehicleId]" options={{ title: 'Reserve', presentation: 'modal' }} />
        <Stack.Screen name="sign-in" options={{ title: 'Sign in', presentation: 'modal' }} />
        <Stack.Screen name="staff/photos/index" options={{ title: 'Vehicle photos' }} />
        <Stack.Screen name="staff/photos/[vehicleId]" options={{ title: 'Vehicle photos' }} />
        <Stack.Screen name="dev/showcase" options={{ title: 'PanelUI showcase' }} />
        <Stack.Screen name="dev/block/[name]" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <ThemedStack />
    </AppProviders>
  );
}
