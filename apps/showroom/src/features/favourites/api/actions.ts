'use server';

import { z } from 'zod';
import { getApi } from '@/lib/api';
import { actionErrorMessage } from '@/lib/action-errors';
import { failure, type ActionResult } from '@/types/action-result';

const Input = z.object({ listingId: z.string().uuid(), saved: z.boolean() });

export async function setFavouriteAction(input: unknown): Promise<ActionResult<{ saved: boolean }>> {
  const parsed = Input.safeParse(input);
  if (!parsed.success) return failure('Invalid request.');
  try {
    const api = getApi();
    const result = parsed.data.saved
      ? await api.savedListings.save(parsed.data.listingId)
      : await api.savedListings.remove(parsed.data.listingId);
    return { ok: true, data: { saved: result.saved } };
  } catch (error) {
    return failure(actionErrorMessage(error));
  }
}
