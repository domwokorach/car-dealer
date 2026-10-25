import 'server-only';
import type { ListVehiclesQuery } from '@car-dealer/contracts';
import { getApi, safely } from '@/lib/api';

export async function searchVehicles(query: Partial<ListVehiclesQuery>) {
  return safely(() => getApi().vehicles.list(query));
}

export async function loadFilterOptions() {
  const [models, branches] = await Promise.all([safely(() => getApi().models.list()), safely(() => getApi().branches.list())]);
  return { models: models ?? [], branches: branches ?? [] };
}
