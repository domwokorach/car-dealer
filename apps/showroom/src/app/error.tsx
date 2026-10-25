'use client';

import { Button, Container } from '@car-dealer/ui-web';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Container className="py-24 text-center">
      <h1 className="text-3xl font-light">Something went wrong</h1>
      <p className="mt-3 text-slate">We couldn’t load this page. Please try again.</p>
      <Button className="mt-8" onClick={reset}>
        Try again
      </Button>
    </Container>
  );
}
