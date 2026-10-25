'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

/** Client-side server-state for interactive mutations (favourite, reserve, enquire). Reads are fetched on the server. */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 }, mutations: { retry: 0 } } }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
