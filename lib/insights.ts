import { MIN_SAMPLE, type Analysis, type Group } from './analysis';
import { signedMoney } from './format';

export interface Insight {
  tone: 'pos' | 'neg' | 'info';
  text: string;
}

const pct = (g: Group) => `${g.winRate.toFixed(0)}%`;
const eligible = (gs: Group[]) => gs.filter((g) => g.trades >= MIN_SAMPLE);

function byWinRate(gs: Group[]) {
  const e = eligible(gs).sort((a, b) => b.winRate - a.winRate || b.net - a.net);
  return { best: e[0], worst: e[e.length - 1] };
}

function byNet(gs: Group[]) {
  const e = eligible(gs).sort((a, b) => b.net - a.net);
  return { best: e[0], worst: e.length > 1 ? e[e.length - 1] : undefined };
}

export function buildInsights(a: Analysis): Insight[] {
  const out: Insight[] = [];

  // Sessions: win rate
  const s = byWinRate(a.sessions);
  if (s.best && s.best.winRate >= 50) {
    out.push({
      tone: 'pos',
      text: `Your best session is ${s.best.label}: ${pct(s.best)} win rate (${s.best.wins} of ${s.best.trades} trades), ${signedMoney(s.best.net)} net.`,
    });
  }
  if (s.worst && s.worst.key !== (s.best && s.best.winRate >= 50 ? s.best.key : undefined) && (s.worst.winRate < 50 || s.worst.net < 0)) {
    out.push({
      tone: 'neg',
      text: `Your weakest session is ${s.worst.label}: ${pct(s.worst)} win rate (${s.worst.wins} of ${s.worst.trades} trades), ${signedMoney(s.worst.net)} net.`,
    });
  }

  // Sources: accuracy
  const src = byWinRate(a.sources);
  if (src.best && src.best.winRate >= 50) {
    out.push({
      tone: 'pos',
      text: `Most accurate source: ${src.best.label} with ${pct(src.best)} winning (${src.best.wins} of ${src.best.trades}), ${signedMoney(src.best.net)} net.`,
    });
  }
  if (src.worst && src.worst.key !== (src.best && src.best.winRate >= 50 ? src.best.key : undefined) && (src.worst.winRate < 50 || src.worst.net < 0)) {
    out.push({
      tone: 'neg',
      text: `Least accurate source: ${src.worst.label} with ${pct(src.worst)} winning (${src.worst.wins} of ${src.worst.trades}), ${signedMoney(src.worst.net)} net.`,
    });
  }

  // Weekdays: money
  const w = byNet(a.weekdays);
  if (w.worst && w.worst.net < 0) {
    out.push({
      tone: 'neg',
      text: `You lose the most money on ${w.worst.label}s: ${signedMoney(w.worst.net)} over ${w.worst.trades} trades (${pct(w.worst)} win rate).`,
    });
  }
  if (w.best && w.best.net > 0) {
    out.push({
      tone: 'pos',
      text: `You win the most money on ${w.best.label}s: ${signedMoney(w.best.net)} over ${w.best.trades} trades (${pct(w.best)} win rate).`,
    });
  }

  // Month phases: money
  const p = byNet(a.phases);
  if (p.worst && p.worst.net < 0) {
    out.push({
      tone: 'neg',
      text: `${p.worst.label} is not a good time for you: ${signedMoney(p.worst.net)} over ${p.worst.trades} trades (${pct(p.worst)} win rate).`,
    });
  }
  if (p.best && p.best.net > 0) {
    out.push({
      tone: 'pos',
      text: `${p.best.label} is your strongest part of the month: ${signedMoney(p.best.net)} over ${p.best.trades} trades (${pct(p.best)} win rate).`,
    });
  }

  if (out.length === 0) {
    out.push({
      tone: 'info',
      text: `Not enough data yet. Insights appear once a session, weekday, source or part of the month has at least ${MIN_SAMPLE} trades.`,
    });
  } else {
    out.push({ tone: 'info', text: `Only groups with at least ${MIN_SAMPLE} trades are used for these insights.` });
  }
  return out;
}
