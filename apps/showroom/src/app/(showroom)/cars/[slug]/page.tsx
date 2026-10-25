import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { VehicleDetailPage } from '@/features/vehicle-details/components/vehicle-detail-page';
import { getVehicle } from '@/features/vehicle-details';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const vehicle = await getVehicle((await params).slug).catch(() => null);
  return { title: vehicle?.title ?? 'Vehicle' };
}

export default async function CarPage({ params }: Props) {
  const slug = (await params).slug;
  const vehicle = await getVehicle(slug);
  if (!vehicle) notFound();
  return <VehicleDetailPage vehicle={vehicle} />;
}
