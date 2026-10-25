import Link from 'next/link';

const LINKS = [
  { href: '/new', label: 'New cars' },
  { href: '/used', label: 'Pre-owned' },
  { href: '/models', label: 'Models' },
  { href: '/branches', label: 'Branches' },
] as const;

export function MainNav() {
  return (
    <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} className="text-sm tracking-wide text-paper/80 hover:text-paper">
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

/** No-JS mobile menu using <details>. */
export function MobileNav() {
  return (
    <details className="relative md:hidden">
      <summary className="cursor-pointer list-none px-3 py-2 text-sm text-paper" aria-label="Menu">
        Menu
      </summary>
      <ul className="absolute right-0 z-20 mt-2 w-48 border border-steel bg-graphite p-2">
        {LINKS.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="block px-3 py-2 text-sm text-paper hover:bg-steel">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}
