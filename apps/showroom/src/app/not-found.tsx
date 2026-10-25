import Link from 'next/link';
import { Container, buttonStyles } from '@car-dealer/ui-web';

export default function NotFound() {
  return (
    <Container className="py-24 text-center">
      <p className="text-xs uppercase tracking-[var(--tracking-eyebrow)] text-accent-strong">404</p>
      <h1 className="mt-3 text-3xl font-light">We couldn’t find that page</h1>
      <Link href="/new" className={`${buttonStyles()} mt-8`}>
        Browse the showroom
      </Link>
    </Container>
  );
}
