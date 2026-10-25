'use client';

import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@car-dealer/ui-web';
import { setFavouriteAction } from '../api/actions';

export function FavouriteButton({ listingId, initiallySaved, signedIn, returnTo }: { listingId: string; initiallySaved: boolean; signedIn: boolean; returnTo: string }) {
  const [saved, setSaved] = useState(initiallySaved);
  const mutation = useMutation({
    mutationFn: (next: boolean) => setFavouriteAction({ listingId, saved: next }),
    onSuccess: (result) => result.ok && setSaved(result.data.saved),
  });

  if (!signedIn) {
    return (
      <Link href={`/sign-in?next=${encodeURIComponent(returnTo)}`} className="text-sm text-steel underline underline-offset-4">
        Sign in to save
      </Link>
    );
  }
  return (
    <Button variant="ghost" size="sm" aria-pressed={saved} onClick={() => mutation.mutate(!saved)} disabled={mutation.isPending}>
      {saved ? '♥ Saved' : '♡ Save'}
    </Button>
  );
}
