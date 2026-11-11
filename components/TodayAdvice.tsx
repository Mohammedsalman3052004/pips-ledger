'use client';

import { useEffect, useState } from 'react';
import {
  MIN_SAMPLE,
  PHASES,
  SESSIONS,
  WEEKDAY_NAMES,
  phaseOfDay,
  sessionHours,
  sessionOfUtcMinutes,
  type Group,
} from '@/lib/analysis';
import { signedMoney } from '@/lib/format';

type State = 'good' | 'bad' | 'mixed' | 'nodata';

interface Factor {
  label: string;
  state: State;
  text: string;
}

function judge(name: string, g: Group | undefined): Factor {
  if (!g || g.trades < MIN_SAMPLE) {
    return {
      label: name,
      state: 'nodata',
      text: `Not enough trades in this period yet to judge (${g?.trades ?? 0} of ${MIN_SAMPLE} needed).`,
    };
  }
  const stats = `${signedMoney(g.net)} over ${g.trades} trades, ${g.winRate.toFixed(0)}% win rate`;
  if (g.net < 0 && g.winRate < 50) return { label: name, state: 'bad', text: `Losing period for you: ${stats}.` };
  if (g.net > 0 && g.winRate >= 50) return { label: name, state: 'good', text: `Winning period for you: ${stats}.` };
  return { label: name, state: 'mixed', text: `Mixed results: ${stats}.` };
}

const VERDICTS = [
  { max: -2, tone: 'bad', title: "Don't trade", sub: 'Your history says most of these conditions are against you.' },
  { max: -1, tone: 'warn', title: 'Better to avoid trading', sub: 'At least one condition has been losing for you.' },
  { max: 0, tone: 'warn', title: 'Trade carefully', sub: 'Conditions are mixed. Keep the lot size small.' },
  { max: 1, tone: 'good', title: 'Fairly good time to trade', sub: 'Your history is positive for this period.' },
  { max: 99, tone: 'good', title: 'Good time to trade', sub: 'Several conditions have been working for you.' },
] as const;

export default function TodayAdvice({
  weekdays,
  sessions,
  phases,
}: {
  weekdays: Group[];
  sessions: Group[];
  phases: Group[];
}) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) return <section className="card advice advice-wait" aria-busy />;

  const day = now.getDay();
  const dayName = WEEKDAY_NAMES[day];
  const utcMin = now.getUTCHours() * 60 + now.getUTCMinutes();
  const session = sessionOfUtcMinutes(utcMin);
  const phase = phaseOfDay(now.getDate());

  const factors: Factor[] = [
    judge(dayName, weekdays.find((g) => g.key === String(day))),
    judge(`${session.label} session`, sessions.find((g) => g.key === session.key)),
    judge(PHASES.find((p) => p.key === phase.key)!.label, phases.find((g) => g.key === phase.key)),
  ];

  const known = factors.filter((f) => f.state !== 'nodata');
  const score = factors.reduce((s, f) => s + (f.state === 'good' ? 1 : f.state === 'bad' ? -1 : 0), 0);
  const verdict = known.length === 0 ? null : VERDICTS.find((v) => score <= v.max)!;
  const weekend = day === 0 || day === 6;

  return (
    <section className="card advice">
      <div className="advice-top">
        <div>
          <div className="advice-day">{dayName}</div>
          <div className="advice-date">
            {now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
        <div className="advice-clock">
          <div className="advice-time num">{now.toLocaleTimeString('en-GB')}</div>
          <div className="advice-date">
            {session.label === 'Off hours' ? 'Off hours' : `${session.label} session`} now ·{' '}
            {sessionHours(SESSIONS.find((s) => s.key === session.key)!)}
          </div>
        </div>
      </div>

      <div className={`verdict verdict-${verdict ? verdict.tone : 'info'}`}>
        <strong>{verdict ? `Today is ${dayName}. ${verdict.title}.` : `Today is ${dayName}. Not enough data yet.`}</strong>
        <span>{verdict ? verdict.sub : `Add more trades to unlock advice (at least ${MIN_SAMPLE} per period).`}</span>
      </div>

      <ul className="reasons">
        {factors.map((f) => (
          <li key={f.label}>
            <span className={`dot dot-${f.state}`} aria-hidden />
            <div>
              <strong>{f.label}</strong>
              <span>{f.text}</span>
            </div>
          </li>
        ))}
      </ul>
      {weekend && <p className="muted small">Markets are closed at weekends, except BTCUSD.</p>}
    </section>
  );
}
