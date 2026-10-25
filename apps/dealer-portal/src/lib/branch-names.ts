import 'server-only';
import { getApi, safely } from './api';

/** id → name for rendering tables. Falls back to a short id if the branch list is unavailable. */
export async function loadBranchNames(): Promise<(id: string) => string> {
  const branches = (await safely(() => getApi().branches.list())) ?? [];
  const map = new Map(branches.map((b) => [b.id, b.name]));
  return (id) => map.get(id) ?? id.slice(0, 8);
}
