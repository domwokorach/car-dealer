import { useRef, useState } from 'react';
import { View } from 'react-native';
import { z } from 'zod';
import { Button, Input, Text } from '@/components/ui';
import type { TextInputRef } from '@/components/ui/input';
import { signInWithPassword, signUpWithPassword } from '@/services/auth';
import { spacing } from '@/theme';

const Credentials = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

type Mode = 'sign-in' | 'sign-up';

export function AuthForm({ onSignedIn }: { onSignedIn: () => void }) {
  const [mode, setMode] = useState<Mode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [message, setMessage] = useState<{ text: string; error: boolean }>();
  const [busy, setBusy] = useState(false);
  const passwordRef = useRef<TextInputRef>(null);

  async function submit() {
    const parsed = Credentials.safeParse({ email, password });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setErrors({ email: flat.email?.[0], password: flat.password?.[0] });
      return;
    }
    setErrors({});
    setMessage(undefined);
    setBusy(true);
    const result = mode === 'sign-in' ? await signInWithPassword(parsed.data.email, parsed.data.password) : await signUpWithPassword(parsed.data.email, parsed.data.password);
    setBusy(false);
    if (!result.ok) return setMessage({ text: result.message, error: true });
    if (result.message) return setMessage({ text: result.message, error: false });
    onSignedIn();
  }

  return (
    <View style={{ gap: spacing.lg }}>
      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <Input
        ref={passwordRef}
        label="Password"
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        secureTextEntry
        autoCapitalize="none"
        autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
        textContentType={mode === 'sign-in' ? 'password' : 'newPassword'}
        returnKeyType="go"
        onSubmitEditing={submit}
      />
      {message ? (
        <Text variant="caption" tone={message.error ? 'danger' : 'muted'} accessibilityRole={message.error ? 'alert' : undefined}>
          {message.text}
        </Text>
      ) : null}
      <Button title={mode === 'sign-in' ? 'Sign in' : 'Create account'} loading={busy} onPress={submit} />
      <Button
        title={mode === 'sign-in' ? 'New here? Create an account' : 'Have an account? Sign in'}
        variant="ghost"
        onPress={() => {
          setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in');
          setMessage(undefined);
        }}
      />
    </View>
  );
}
