import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { resolveApiUrl } from '@/utils/api-url';

/**
 * Only EXPO_PUBLIC_* values exist in the app bundle, and they are public by definition.
 * Secrets (database URL, Supabase service-role key) must never be added here.
 */
const read = (v: string | undefined) => (v && v.trim() !== '' ? v.trim() : undefined);

export const env = {
  apiUrl: read(process.env.EXPO_PUBLIC_API_URL),
  supabaseUrl: read(process.env.EXPO_PUBLIC_SUPABASE_URL),
  supabaseKey: read(process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
};

export const apiTarget = resolveApiUrl({
  configured: env.apiUrl,
  hostUri: Constants.expoConfig?.hostUri,
  platform: Platform.OS,
  isDev: __DEV__,
});

export const authConfigured = Boolean(env.supabaseUrl && env.supabaseKey);
