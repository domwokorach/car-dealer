import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { isSignedIn } from '@/lib/session';
import { QueryProvider } from '@/providers/query-provider';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: { default: 'Car Dealer: new and pre-owned cars', template: '%s | Car Dealer' },
  description: 'Browse, compare, enquire about and reserve new and pre-owned cars at your local branch.',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const signedIn = await isSignedIn().catch(() => false);
  return (
    <html lang="en-GB">
      <body className="flex min-h-screen flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-paper focus:p-3">
          Skip to content
        </a>
        <SiteHeader signedIn={signedIn} />
        <QueryProvider>
          <main id="main" className="flex-1">
            {children}
          </main>
        </QueryProvider>
        <SiteFooter />
      </body>
    </html>
  );
}
