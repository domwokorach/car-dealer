import type { Metadata } from 'next';
import { VehicleSearchPage } from '@/features/vehicle-search';
import type { SearchParams } from '@/types/search-params';

export const metadata: Metadata = { title: 'Pre-owned cars' };
export const dynamic = 'force-dynamic';

export default async function UsedCarsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <VehicleSearchPage condition="USED" basePath="/used" params={await searchParams} />;
}
