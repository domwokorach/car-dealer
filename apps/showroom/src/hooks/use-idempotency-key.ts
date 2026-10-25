'use client';

import { useState } from 'react';

/** A stable UUID per mounted form, so a double-click or network retry replays the same request server-side. */
export function useIdempotencyKey(): string {
  const [key] = useState(() => crypto.randomUUID());
  return key;
}
