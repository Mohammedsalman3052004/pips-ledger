import { createClient } from '@/lib/supabase/server';
import { parseAccountOrAll, parseTrader } from '@/lib/config';
import { SESSIONS, analyze, sessionHours } from '@/lib/analysis';
import { buildInsights } from '@/lib/insights';
import type { Trade } from '@/lib/types';
import Filters from '@/components/Filters';
import Stats from '@/components/Stats';
import TodayAdvice from '@/components/TodayAdvice';
import GroupCard from '@/components/GroupCard';

export const metadata = { title: 'Analysis' };

export default async function AnalysisPage({
  searchParams,
}: {
  searchParams: { account?: string; trader?: string };
}) {
  const account = parseAccountOrAll(searchParams.account);
  const trader = parseTrader(searchParams.trader);

  let query = createClient()
    .from('trades')
    .select('*')
    .order('trade_date', { ascending: true })
    .order('trade_time', { ascending: true });
  if (account !== 'all') query = query.eq('account', account);
  if (trader) query = query.eq('trader', trader);

  const { data, error } = await query;
  const trades = (data ?? []) as Trade[];
  const a = analyze(trades);
  const insights = buildInsights(a);

  const sessionNote = SESSIONS.filter((s) => s.key !== 'off')
    .map((s) => `${s.label} ${sessionHours(s)}`)
    .join(' · ');

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Analysis</h1>
          <p className="muted">What your own trades say about when and how you win.</p>
        </div>
      </div>
      <Filters base="/analysis" account={account} trader={trader} allowAll />
      {error && <div className="alert alert-error">{error.message}</div>}

      <TodayAdvice weekdays={a.weekdays} sessions={a.sessions} phases={a.phases} />

      <Stats
        net={a.overall.net}
        count={a.overall.trades}
        winRate={a.overall.winRate}
        avgWin={trades.filter((t) => t.result === 'profit').reduce((s, t, _, arr) => s + t.amount / arr.length, 0)}
        avgLoss={trades.filter((t) => t.result === 'loss').reduce((s, t, _, arr) => s + t.amount / arr.length, 0)}
      />

      <section className="card insights">
        <h2>Key findings</h2>
        <ul>
          {insights.map((i, n) => (
            <li key={n} className={`insight insight-${i.tone}`}>
              <span className="dot" aria-hidden />
              {i.text}
            </li>
          ))}
        </ul>
      </section>

      <div className="agrid">
        <GroupCard
          title="Trading sessions"
          note={`Your local time: ${sessionNote}. London/New York overlap counts as New York.`}
          groups={a.sessions}
          nameHeader="Session"
        />
        <GroupCard title="Entry source" note="Which source gives you the best accuracy." groups={a.sources} nameHeader="Source" />
        <GroupCard title="Day of the week" groups={a.weekdays} nameHeader="Day" />
        <GroupCard title="Part of the month" groups={a.phases} nameHeader="Period" />
        <GroupCard title="Currency" groups={a.currencies} nameHeader="Pair" />
        <GroupCard title="Trader and direction" groups={[...a.traders, ...a.sides]} nameHeader="Group" />
      </div>
    </>
  );
}
