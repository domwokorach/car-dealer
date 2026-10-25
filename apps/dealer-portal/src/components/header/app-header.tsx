import type { SessionUser } from '@car-dealer/contracts';
import { Badge, Button } from '@car-dealer/ui-web';
import { signOutAction } from '@/app/(auth)/sign-in/actions';
import { humanise } from '@/lib/format';
import { MobileNav } from '../sidebar/sidebar';

export function AppHeader({ user, showAdmin }: { user: SessionUser; showAdmin: boolean }) {
  const roles =
    user.branchAccess === 'all' ? [humanise(user.role)] : [...new Set(user.branchAccess.map((m) => humanise(m.role)))];
  return (
    <header className="flex h-16 items-center justify-between border-b border-silver/60 bg-paper px-4 sm:px-6">
      <MobileNav showAdmin={showAdmin} />
      <div className="hidden md:block" />
      <div className="flex items-center gap-4">
        <div className="text-right text-sm">
          <p className="font-medium">{user.fullName ?? user.email}</p>
          <p className="flex justify-end gap-1">
            {roles.map((r) => (
              <Badge key={r} tone="accent">{r}</Badge>
            ))}
          </p>
        </div>
        <form action={signOutAction}>
          <Button type="submit" variant="secondary" size="sm">Sign out</Button>
        </form>
      </div>
    </header>
  );
}
