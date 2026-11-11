import Link from 'next/link';
import { ACCOUNTS, TRADERS, type AccountKey, type Trader } from '@/lib/config';

function href(base: string, account: AccountKey | 'all', trader?: Trader) {
  const p = new URLSearchParams({ account });
  if (trader) p.set('trader', trader);
  return `${base}?${p.toString()}`;
}

export default function Filters({
  base,
  account,
  trader,
  allowAll = false,
}: {
  base: string;
  account: AccountKey | 'all';
  trader?: Trader;
  allowAll?: boolean;
}) {
  return (
    <div className="filters">
      <div className="tabs" role="tablist" aria-label="Account">
        {allowAll && (
          <Link
            href={href(base, 'all', trader)}
            role="tab"
            aria-selected={account === 'all'}
            className={account === 'all' ? 'tab active' : 'tab'}
          >
            Both accounts
          </Link>
        )}
        {ACCOUNTS.map((a) => (
          <Link
            key={a.key}
            href={href(base, a.key, trader)}
            role="tab"
            aria-selected={a.key === account}
            className={a.key === account ? 'tab active' : 'tab'}
          >
            {a.label} account
          </Link>
        ))}
      </div>
      <div className="chips" aria-label="Trader">
        <Link href={href(base, account)} className={!trader ? 'chip active' : 'chip'}>
          Everyone
        </Link>
        {TRADERS.map((t) => (
          <Link key={t} href={href(base, account, t)} className={trader === t ? 'chip active' : 'chip'}>
            {t}
          </Link>
        ))}
      </div>
    </div>
  );
}
