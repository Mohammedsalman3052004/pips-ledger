import type { Metadata, Viewport } from 'next';
import './globals.css';
import Header from '@/components/Header';
import { getSessionProfile } from '@/lib/auth';

export const metadata: Metadata = {
  title: { default: 'Pips Ledger', template: '%s · Pips Ledger' },
  description: 'Shared trade journal for our Funding Pips accounts.',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export const dynamic = 'force-dynamic';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const profile = await getSessionProfile();
  return (
    <html lang="en">
      <body>
        {profile && <Header profile={profile} />}
        <main className={profile ? 'page' : undefined}>{children}</main>
      </body>
    </html>
  );
}
