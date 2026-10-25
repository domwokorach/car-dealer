import Image from 'next/image';
import Link from 'next/link';
import type { VehicleSummary } from '@car-dealer/contracts';
import { Badge } from '@car-dealer/ui-web';
import { formatMileage, formatPence } from '@car-dealer/utils';
import { humanise } from '@/lib/format';

export function VehicleCard({ vehicle }: { vehicle: VehicleSummary }) {
  const meta = [vehicle.registrationYear, vehicle.mileage === null ? null : formatMileage(vehicle.mileage), humanise(vehicle.fuelType)]
    .filter(Boolean)
    .join(' · ');
  return (
    <article className="group border border-silver/60 bg-paper transition-shadow hover:shadow-lg">
      <Link href={`/cars/${vehicle.slug}`} className="block focus-visible:outline-offset-[-2px]">
        <div className="relative aspect-[16/10] bg-mist">
          {vehicle.imageUrl ? (
            <Image src={vehicle.imageUrl} alt="" fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs uppercase tracking-widest text-slate">Photos coming soon</div>
          )}
        </div>
        <div className="space-y-3 p-5">
          <div className="flex items-center justify-between gap-2">
            <Badge tone={vehicle.condition === 'NEW' ? 'accent' : 'neutral'}>{humanise(vehicle.condition)}</Badge>
            {!vehicle.available ? <Badge tone="warning">Reserved</Badge> : null}
          </div>
          <h3 className="text-lg font-light tracking-wide text-ink group-hover:underline">{vehicle.title}</h3>
          <p className="text-sm text-slate">{meta}</p>
          <p className="flex items-baseline justify-between">
            <span className="text-xl font-medium text-ink">{formatPence(vehicle.pricePence)}</span>
            <span className="text-xs text-slate">{vehicle.branchCity}</span>
          </p>
        </div>
      </Link>
    </article>
  );
}
