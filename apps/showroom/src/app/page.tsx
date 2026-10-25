import Link from 'next/link';
import { Container, EmptyState, buttonStyles } from '@car-dealer/ui-web';
import { VehicleGrid } from '@/components/vehicles/vehicle-grid';
import { searchVehicles } from '@/features/vehicle-search';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const latest = await searchVehicles({ pageSize: 3, sort: 'newest' });
  return (
    <>
      <section className="bg-gradient-to-b from-ink to-graphite text-paper">
        <Container className="py-24 sm:py-32">
          <p className="mb-4 text-xs uppercase tracking-[var(--tracking-eyebrow)] text-accent">Online showroom</p>
          <h1 className="max-w-3xl text-4xl font-light leading-tight tracking-[var(--tracking-display)] sm:text-6xl">
            Find your next car, <span className="text-silver">reserve it online.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-silver">
            Every vehicle across all of our branches in one place. See real stock, lock in the price, and collect from your local branch.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/new" className={buttonStyles({ size: 'lg' }).replace('bg-ink text-paper hover:bg-steel', 'bg-paper text-ink hover:bg-silver')}>
              Browse new cars
            </Link>
            <Link href="/used" className="inline-flex h-14 items-center border border-paper/60 px-8 text-paper hover:bg-paper hover:text-ink">
              Browse pre-owned
            </Link>
          </div>
        </Container>
      </section>

      <Container className="py-16">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="text-2xl font-light tracking-wide">Latest arrivals</h2>
          <Link href="/new" className="text-sm underline underline-offset-4">View all</Link>
        </div>
        {latest === null ? (
          <EmptyState title="The showroom is temporarily unavailable">Please try again in a few minutes.</EmptyState>
        ) : latest.items.length === 0 ? (
          <EmptyState title="No vehicles are listed yet">Check back soon.</EmptyState>
        ) : (
          <VehicleGrid vehicles={latest.items} />
        )}
      </Container>
    </>
  );
}
