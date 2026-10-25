import { router, useLocalSearchParams } from 'expo-router';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { Screen } from '@/components/layout/screen';
import { Text } from '@/components/ui';
import { AuthForm } from '@/features/authentication/components/auth-form';
import { authConfigured } from '@/services/env';
import { spacing } from '@/theme';

/** Only same-app relative paths are valid destinations (prevents redirect abuse via deep links). */
const safeNext = (next: string | undefined) => (next && next.startsWith('/') && !next.startsWith('//') ? next : '/account');

export default function SignInScreen() {
  const { next } = useLocalSearchParams<{ next?: string }>();
  const done = () => (router.canGoBack() ? router.back() : router.replace(safeNext(next) as '/account'));

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen contentStyle={{ gap: spacing.xl }}>
        <Text variant="title">Welcome</Text>
        <Text tone="muted">Sign in to reserve cars, book test drives and save favourites.</Text>
        {authConfigured ? (
          <AuthForm onSignedIn={done} />
        ) : (
          <Text tone="danger" accessibilityRole="alert">
            Sign-in isn’t configured in this build. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in apps/mobile/.env and restart Metro.
          </Text>
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}
