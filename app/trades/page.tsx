import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { parseAccount, parseTrader } from '@/lib/config';
import { formatDate, formatPrice, formatTime, signedMoney } from '@/lib/format';
import { pnlOf } from '@/lib/sheet';
import type { Trade } from '@/lib/types';
import Filters from '@/components/Filters';
import DeleteButton from '@/components/DeleteButton';

export const metadata = { title: 'Manage trades' };

export default async function ManagePage({
  searchParams,
}: {
  searchParams: { account?: string; trader?: string };
}) {
  await requireAdmin();
  const account = parseAccount(searchParams.account);
  const trader = parseTrader(searchParams.trader);

  let query = createClient()
    .from('trades')
    .select('*')
    .eq('account', account)
    .order('trade_date', { ascending: false })
    .order('trade_time', { ascending: false });
  if (trader) query = query.eq('trader', trader);

  const { data, error } = await query;
  const trades = (data ?? []) as Trade[];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Manage trades</h1>
          <p className="muted">Newest first. Edit or delete any entry.</p>
        </div>
        <Link href={`/trades/new?account=${account}`} className="btn btn-primary">
          Add trade
        </Link>
      </div>
      <Filters base="/trades" account={account} trader={trader} />
      {error && <div className="alert alert-error">{error.message}</div>}

      <div className="sheet-wrap">
        <table className="sheet sheet-manage">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>MT5 time</th>
              <th>Currency</th>
              <th className="r">Lot</th>
              <th>Side</th>
              <th>Result</th>
              <th className="r">Amount</th>
              <th className="r">Entry</th>
              <th className="r">Exit</th>
              <th>Source</th>
              <th>Trader</th>
              <th className="r">Actions</th>
            </tr>
          </thead>
          <tbody>
            {trades.length === 0 && (
              <tr>
                <td colSpan={13} className="empty">
                  No trades yet.
                </td>
              </tr>
            )}
            {trades.map((t) => (
              <tr key={t.id}>
                <td className="num">{formatDate(t.trade_date)}</td>
                <td className="num">{formatTime(t.trade_time)}</td>
                <td className="num muted">{formatTime(t.mt5_time)}</td>
                <td className="strong">{t.currency}</td>
                <td className="num r">{t.lot_size.toFixed(2)}</td>
                <td>
                  <span className={`pill pill-${t.side}`}>{t.side}</span>
                </td>
                <td>
                  <span className={`pill pill-${t.result}`}>{t.result}</span>
                </td>
                <td className={`num r strong ${t.result === 'profit' ? 'pos' : 'neg'}`}>
                  {signedMoney(pnlOf(t))}
                </td>
                <td className="num r">{formatPrice(t.entry_price)}</td>
                <td className="num r">{formatPrice(t.exit_price)}</td>
                <td>{t.source || <span className="muted">—</span>}</td>
                <td>{t.trader}</td>
                <td className="r">
                  <div className="row-actions">
                    <Link href={`/trades/${t.id}/edit`} className="btn btn-secondary btn-sm">
                      Edit
                    </Link>
                    <DeleteButton id={t.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
