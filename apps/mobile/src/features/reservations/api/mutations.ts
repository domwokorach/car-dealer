import { useMutation, useQueryClient } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';
import { useState } from 'react';
import { getApi } from '@/services/api';

/** One idempotency key per mounted screen: a double-tap or network retry replays the same reservation server-side. */
export function useReserve(listingId: string) {
  const queryClient = useQueryClient();
  const [idempotencyKey] = useState(() => randomUUID());
  return useMutation({
    mutationFn: () => getApi().reservations.create({ listingId, idempotencyKey }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['me', 'reservations'] });
      void queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      void queryClient.invalidateQueries({ queryKey: ['vehicle'] });
    },
  });
}
