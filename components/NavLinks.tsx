'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavLinks({ isAdmin }: { isAdmin: boolean }) {
  const path = usePathname();
  const items = [
    { href: '/', label: 'Sheet', match: (p: string) => p === '/' },
    { href: '/analysis', label: 'Analysis', match: (p: string) => p === '/analysis' },
    ...(isAdmin
      ? [
          { href: '/trades/new', label: 'Add trade', match: (p: string) => p === '/trades/new' },
          {
            href: '/trades',
            label: 'Manage',
            match: (p: string) => p === '/trades' || /^\/trades\/[^/]+\/edit/.test(p),
          },
        ]
      : []),
  ];
  return (
    <nav className="nav" aria-label="Main">
      {items.map((i) => (
        <Link key={i.href} href={i.href} className={i.match(path) ? 'nav-link active' : 'nav-link'}>
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
