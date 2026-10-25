import type { VehicleDetail } from '@car-dealer/contracts';
import { Badge } from '@car-dealer/ui-web';
import { formatPence } from '@car-dealer/utils';
import { EnquiryForm } from '@/features/enquiries';
import { FavouriteButton, getSavedListings } from '@/features/favourites';
import { ReserveButton } from '@/features/reservations';
import { TestDriveForm } from '@/features/test-drives';
import { isSignedIn } from '@/lib/session';
import { VehicleGallery } from './vehicle-gallery';
import { VehicleSpecs } from './vehicle-specs';

export async function VehicleDetailPage({ vehicle }: { vehicle: VehicleDetail }) {
  const signedIn = await isSignedIn().catch(() => false);
  const saved = signedIn ? ((await getSavedListings()) ?? []) : [];
  const returnTo = `/cars/${vehicle.slug}`;

  return (
    <div className="grid gap-12 lg:grid-cols-[3fr_2fr]">
      <div className="space-y-10">
        <VehicleGallery images={vehicle.images} title={vehicle.title} />
        {vehicle.description ? <p className="max-w-prose text-slate">{vehicle.description}</p> : null}
        <section aria-labelledby="specs">
          <h2 id="specs" className="mb-2 text-xl font-light tracking-wide">Specification</h2>
          <VehicleSpecs vehicle={vehicle} />
        </section>
      </div>

      <aside className="space-y-8 lg:sticky lg:top-6 lg:self-start">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Badge tone={vehicle.available ? 'success' : 'warning'}>{vehicle.available ? 'Available' : 'Reserved'}</Badge>
            <FavouriteButton
              listingId={vehicle.listingId}
              initiallySaved={saved.some((s) => s.listingId === vehicle.listingId)}
              signedIn={signedIn}
              returnTo={returnTo}
            />
          </div>
          <h1 className="text-3xl font-light tracking-wide">{vehicle.title}</h1>
          <p className="text-3xl font-medium">{formatPence(vehicle.pricePence)}</p>
          <p className="text-sm text-slate">
            At {vehicle.branchName}, {vehicle.branchCity}
          </p>
        </div>

        <ReserveButton listingId={vehicle.listingId} available={vehicle.available} signedIn={signedIn} returnTo={returnTo} />

        <section aria-labelledby="td" className="space-y-3 border-t border-silver/60 pt-6">
          <h2 id="td" className="text-lg font-light tracking-wide">Book a test drive</h2>
          <TestDriveForm listingId={vehicle.listingId} signedIn={signedIn} returnTo={returnTo} />
        </section>

        <section aria-labelledby="enq" className="space-y-3 border-t border-silver/60 pt-6">
          <h2 id="enq" className="text-lg font-light tracking-wide">Ask the branch</h2>
          <EnquiryForm listingId={vehicle.listingId} defaultMessage={`Hello, I’m interested in the ${vehicle.title}.`} />
        </section>
      </aside>
    </div>
  );
}
