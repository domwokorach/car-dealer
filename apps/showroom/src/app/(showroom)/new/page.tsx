import type { Metadata } from 'next';
import { VehicleSearchPage } from '@/features/vehicle-search';
import type { SearchParams } from '@/types/search-params';

export const metadata: Metadata = { title: 'New cars' };
export const dynamic = 'force-dynamic';

export default async function NewCarsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <VehicleSearchPage condition="NEW" basePath="/new" params={await searchParams} />;
}
