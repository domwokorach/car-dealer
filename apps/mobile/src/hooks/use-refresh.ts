import { useState } from 'react';

/** Pull-to-refresh helper for screens made of several queries. */
export function useRefresh(refetchers: (() => Promise<unknown>)[]) {
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = () => {
    setRefreshing(true);
    void Promise.allSettled(refetchers.map((r) => r())).finally(() => setRefreshing(false));
  };
  return { refreshing, onRefresh };
}
