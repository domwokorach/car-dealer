import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getApi } from '@/services/api';
import { useAuth } from '@/providers/auth-provider';

/** Query keys beginning with "me" are per-user and are cleared on sign-out (see AuthProvider). */
export const savedKey = ['me', 'saved'] as const;

export function useSavedListings() {
  const { signedIn } = useAuth();
  return useQuery({ queryKey: savedKey, queryFn: () => getApi().savedListings.list(), enabled: signedIn });
}

export function useSetFavourite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ listingId, saved }: { listingId: string; saved: boolean }) =>
      saved ? getApi().savedListings.save(listingId) : getApi().savedListings.remove(listingId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: savedKey }),
  });
}
