'use client';

import { Button } from '@car-dealer/ui-web';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md py-24 text-center">
      <h1 className="text-2xl font-light">Something went wrong</h1>
      <p className="mt-2 text-slate">We couldn’t load this page.</p>
      <Button className="mt-6" onClick={reset}>Try again</Button>
    </div>
  );
}
