import Link from 'next/link';
import { Container } from '@car-dealer/ui-web';
import { MainNav, MobileNav } from '../navigation/main-nav';

export function SiteHeader({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="bg-ink">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="text-lg font-light uppercase tracking-[0.3em] text-paper">
          Car Dealer
        </Link>
        <MainNav />
        <div className="flex items-center gap-2">
          <Link href={signedIn ? '/account' : '/sign-in'} className="px-3 py-2 text-sm text-paper/80 hover:text-paper">
            {signedIn ? 'My account' : 'Sign in'}
          </Link>
          <MobileNav />
        </div>
      </Container>
    </header>
  );
}
