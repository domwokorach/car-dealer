import Link from 'next/link';
import { Container } from '@car-dealer/ui-web';

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-graphite py-12 text-sm text-silver">
      <Container className="flex flex-col gap-6 sm:flex-row sm:justify-between">
        <p className="uppercase tracking-[0.3em] text-paper">Car Dealer</p>
        <nav aria-label="Footer" className="flex gap-6">
          <Link href="/new" className="hover:text-paper">New</Link>
          <Link href="/used" className="hover:text-paper">Pre-owned</Link>
          <Link href="/branches" className="hover:text-paper">Branches</Link>
          <Link href="/about" className="hover:text-paper">About</Link>
        </nav>
      </Container>
    </footer>
  );
}
