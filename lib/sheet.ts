import type { Trade } from './types';
import { dayDiff } from './time';

export type SheetItem =
  | { kind: 'trade'; trade: Trade; pnl: number; total: number }
  | { kind: 'gap'; days: number; key: string };

/** Signed P&L of a trade. */
export const pnlOf = (t: Trade) => (t.result === 'loss' ? -t.amount : t.amount);

/** Builds the sheet rows: running total per row and "N day gap" separators. */
export function buildSheet(trades: Trade[]): SheetItem[] {
  const items: SheetItem[] = [];
  let total = 0;
  let prev: Trade | null = null;

  for (const trade of trades) {
    if (prev) {
      const gap = dayDiff(prev.trade_date, trade.trade_date) - 1;
      if (gap >= 1) items.push({ kind: 'gap', days: gap, key: `gap-${trade.id}` });
    }
    const pnl = pnlOf(trade);
    total = Math.round((total + pnl) * 100) / 100;
    items.push({ kind: 'trade', trade, pnl, total });
    prev = trade;
  }
  return items;
}

export function summarize(trades: Trade[]) {
  const wins = trades.filter((t) => t.result === 'profit');
  const losses = trades.filter((t) => t.result === 'loss');
  const net = trades.reduce((s, t) => s + pnlOf(t), 0);
  const sum = (a: Trade[]) => a.reduce((s, t) => s + t.amount, 0);
  return {
    net: Math.round(net * 100) / 100,
    count: trades.length,
    winRate: trades.length ? (wins.length / trades.length) * 100 : 0,
    avgWin: wins.length ? sum(wins) / wins.length : 0,
    avgLoss: losses.length ? sum(losses) / losses.length : 0,
  };
}
