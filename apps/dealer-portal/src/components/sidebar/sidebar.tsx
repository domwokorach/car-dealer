import Link from 'next/link';

interface NavItem {
  href: string;
  label: string;
}

const MAIN: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/inventory', label: 'Inventory' },
  { href: '/enquiries', label: 'Enquiries' },
  { href: '/test-drives', label: 'Test drives' },
  { href: '/reservations', label: 'Reservations' },
  { href: '/orders', label: 'Orders' },
  { href: '/transfers', label: 'Transfers' },
  { href: '/customers', label: 'Customers' },
];

const ADMIN: NavItem[] = [
  { href: '/admin/branches', label: 'Branches' },
  { href: '/admin/staff', label: 'Staff' },
  { href: '/admin/audit', label: 'Audit log' },
];

function Group({ title, items }: { title?: string; items: NavItem[] }) {
  return (
    <div>
      {title ? <p className="mb-2 px-3 text-xs uppercase tracking-widest text-silver/60">{title}</p> : null}
      <ul className="space-y-1">
        {items.map((i) => (
          <li key={i.href}>
            <Link href={i.href} className="block px-3 py-2 text-sm text-silver hover:bg-steel hover:text-paper">
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Sidebar({ showAdmin }: { showAdmin: boolean }) {
  return (
    <aside className="hidden w-60 shrink-0 flex-col gap-8 bg-graphite p-4 md:flex">
      <p className="px-3 pt-2 text-sm uppercase tracking-[0.3em] text-paper">Car Dealer</p>
      <nav aria-label="Primary" className="flex flex-col gap-8">
        <Group items={MAIN} />
        {showAdmin ? <Group title="Head office" items={ADMIN} /> : null}
      </nav>
    </aside>
  );
}

/** Small-screen navigation without JavaScript. */
export function MobileNav({ showAdmin }: { showAdmin: boolean }) {
  const items = showAdmin ? [...MAIN, ...ADMIN] : MAIN;
  return (
    <details className="relative md:hidden">
      <summary className="cursor-pointer list-none px-3 py-2 text-sm">Menu</summary>
      <ul className="absolute left-0 z-20 mt-2 w-56 border border-silver bg-paper p-2 shadow-lg">
        {items.map((i) => (
          <li key={i.href}>
            <Link href={i.href} className="block px-3 py-2 text-sm hover:bg-mist">{i.label}</Link>
          </li>
        ))}
      </ul>
    </details>
  );
}
