import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable } from 'react-native';
import { useAuth } from '@/providers/auth-provider';
import { colors, useColors } from '@/theme';
import { useSavedListings, useSetFavourite } from '../api/queries';

export function FavouriteButton({ listingId, returnTo }: { listingId: string; returnTo: string }) {
  const { signedIn } = useAuth();
  const c = useColors();
  const saved = useSavedListings();
  const mutation = useSetFavourite();
  const isSaved = saved.data?.some((s) => s.listingId === listingId) ?? false;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isSaved ? 'Remove from saved cars' : 'Save this car'}
      accessibilityState={{ selected: isSaved }}
      hitSlop={12}
      disabled={mutation.isPending}
      onPress={() =>
        signedIn
          ? mutation.mutate({ listingId, saved: !isSaved })
          : router.push({ pathname: '/sign-in', params: { next: returnTo } })
      }
    >
      <Ionicons name={isSaved ? 'heart' : 'heart-outline'} size={26} color={isSaved ? colors.danger : c.foreground} />
    </Pressable>
  );
}
