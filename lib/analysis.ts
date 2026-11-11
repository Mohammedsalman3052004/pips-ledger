import { LOCAL_UTC_OFFSET_MINUTES } from './config';
import { pnlOf } from './sheet';
import type { Trade } from './types';

/** A bucket needs at least this many trades before we trust it. */
export const MIN_SAMPLE = 3;

export interface Group {
  key: string;
  label: string;
  trades: number;
  wins: number;
  winRate: number;
  net: number;
  avg: number;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

const empty = (key: string, label: string): Group => ({ key, label, trades: 0, wins: 0, winRate: 0, net: 0, avg: 0 });

export function aggregate(trades: Trade[], keyOf: (t: Trade) => { key: string; label: string }): Group[] {
  const map = new Map<string, { label: string; trades: number; wins: number; net: number }>();
  for (const t of trades) {
    const { key, label } = keyOf(t);
    let g = map.get(key);
    if (!g) {
      g = { label, trades: 0, wins: 0, net: 0 };
      map.set(key, g);
    }
    g.trades += 1;
    if (t.result === 'profit') g.wins += 1;
    g.net += pnlOf(t);
  }
  return [...map.entries()].map(([key, g]) => ({
    key,
    label: g.label,
    trades: g.trades,
    wins: g.wins,
    winRate: (g.wins / g.trades) * 100,
    net: r2(g.net),
    avg: r2(g.net / g.trades),
  }));
}

function fixed(defs: { key: string; label: string }[], groups: Group[]): Group[] {
  return defs.map((d) => groups.find((g) => g.key === d.key) ?? empty(d.key, d.label));
}

/* ---------- sessions (defined in UTC minutes) ---------- */
export const SESSIONS = [
  { key: 'asian', label: 'Asian', from: 0, to: 480 }, // 00:00-08:00 UTC
  { key: 'london', label: 'London', from: 480, to: 780 }, // 08:00-13:00 UTC
  { key: 'newyork', label: 'New York', from: 780, to: 1320 }, // 13:00-22:00 UTC (London overlap counts here)
  { key: 'off', label: 'Off hours', from: 1320, to: 1440 }, // 22:00-24:00 UTC
] as const;

export type SessionKey = (typeof SESSIONS)[number]['key'];

export function sessionOfUtcMinutes(m: number) {
  return SESSIONS.find((s) => m >= s.from && m < s.to) ?? SESSIONS[3];
}

const hhmm = (min: number) => {
  const m = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

/** "05:30 - 13:30" in the user's local time. */
export function sessionHours(s: { from: number; to: number }) {
  return `${hhmm(s.from + LOCAL_UTC_OFFSET_MINUTES)} - ${hhmm(s.to + LOCAL_UTC_OFFSET_MINUTES)}`;
}

function sessionOfTrade(t: Trade) {
  const [h, m] = t.trade_time.split(':').map(Number);
  const utc = (((h * 60 + m - LOCAL_UTC_OFFSET_MINUTES) % 1440) + 1440) % 1440;
  return sessionOfUtcMinutes(utc);
}

/* ---------- weekdays & month phases ---------- */
export const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

function weekdayOfDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export const PHASES = [
  { key: 'start', label: 'Start of month (1-10)' },
  { key: 'middle', label: 'Middle of month (11-20)' },
  { key: 'end', label: 'End of month (21-31)' },
] as const;

export function phaseOfDay(day: number) {
  return day <= 10 ? PHASES[0] : day <= 20 ? PHASES[1] : PHASES[2];
}

/* ---------- full analysis ---------- */
export interface Analysis {
  overall: Group;
  sessions: Group[];
  weekdays: Group[];
  phases: Group[];
  sources: Group[];
  currencies: Group[];
  traders: Group[];
  sides: Group[];
}

export function analyze(trades: Trade[]): Analysis {
  const byNet = (a: Group, b: Group) => b.trades - a.trades || b.net - a.net;

  const weekdayDefs = WEEK_ORDER.map((d) => ({ key: String(d), label: WEEKDAY_NAMES[d] }));
  const weekdays = fixed(
    weekdayDefs,
    aggregate(trades, (t) => {
      const d = weekdayOfDate(t.trade_date);
      return { key: String(d), label: WEEKDAY_NAMES[d] };
    })
  ).filter((g) => g.trades > 0 || !['6', '0'].includes(g.key));

  return {
    overall: aggregate(trades, () => ({ key: 'all', label: 'All trades' }))[0] ?? empty('all', 'All trades'),
    sessions: fixed(
      SESSIONS.map((s) => ({ key: s.key, label: s.label })),
      aggregate(trades, (t) => {
        const s = sessionOfTrade(t);
        return { key: s.key, label: s.label };
      })
    ).filter((g) => g.trades > 0 || g.key !== 'off'),
    weekdays,
    phases: fixed(
      PHASES.map((p) => ({ key: p.key, label: p.label })),
      aggregate(trades, (t) => {
        const p = phaseOfDay(Number(t.trade_date.slice(8, 10)));
        return { key: p.key, label: p.label };
      })
    ),
    sources: aggregate(trades, (t) => {
      const raw = (t.source ?? '').trim();
      return { key: raw.toLowerCase() || '-', label: raw || 'No source' };
    }).sort(byNet),
    currencies: aggregate(trades, (t) => ({ key: t.currency, label: t.currency })).sort(byNet),
    traders: aggregate(trades, (t) => ({ key: t.trader, label: t.trader })).sort(byNet),
    sides: aggregate(trades, (t) => ({ key: t.side, label: t.side === 'buy' ? 'Buy' : 'Sell' })).sort(byNet),
  };
}
