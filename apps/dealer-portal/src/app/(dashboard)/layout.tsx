import type { ReactNode } from 'react';
import { AppHeader } from '@/components/header/app-header';
import { Sidebar } from '@/components/sidebar/sidebar';
import { isAdmin, requireStaff } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // Gate for UX only. Every API call is independently authorised server-side.
  const user = await requireStaff('/dashboard');
  const showAdmin = isAdmin(user);
  return (
    <div className="flex min-h-screen">
      <Sidebar showAdmin={showAdmin} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader user={user} showAdmin={showAdmin} />
        <main id="main" className="flex-1 space-y-6 bg-mist/40 p-4 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
