import { createClient } from '@/lib/supabase/server';
import { parseAccount, parseTrader } from '@/lib/config';
import { buildSheet, summarize } from '@/lib/sheet';
import type { Trade } from '@/lib/types';
import Filters from '@/components/Filters';
import Stats from '@/components/Stats';
import SheetTable from '@/components/SheetTable';
import ExportMenu from '@/components/ExportMenu';

export const metadata = { title: 'Sheet' };

export default async function SheetPage({
  searchParams,
}: {
  searchParams: { account?: string; trader?: string };
}) {
  const account = parseAccount(searchParams.account);
  const trader = parseTrader(searchParams.trader);

  let query = createClient()
    .from('trades')
    .select('*')
    .eq('account', account)
    .order('trade_date', { ascending: true })
    .order('trade_time', { ascending: true });
  if (trader) query = query.eq('trader', trader);

  const { data, error } = await query;
  const trades = (data ?? []) as Trade[];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Trade sheet</h1>
          <p className="muted">
            Times shown are local time. The last column is the running total after each trade.
          </p>
        </div>
        <ExportMenu account={account} trader={trader} />
      </div>
      <Filters base="/" account={account} trader={trader} />
      {error && <div className="alert alert-error">{error.message}</div>}
      <Stats {...summarize(trades)} />
      <SheetTable items={buildSheet(trades)} />
    </>
  );
}
