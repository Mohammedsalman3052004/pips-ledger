import { plainMoney, signedMoney, tone } from '@/lib/format';

interface Props {
  net: number;
  count: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
}

export default function Stats({ net, count, winRate, avgWin, avgLoss }: Props) {
  return (
    <section className="stats" aria-label="Summary">
      <div className="stat stat-main">
        <span className="stat-label">Net result</span>
        <span className={`stat-value num ${tone(net)}`}>{signedMoney(net)}</span>
      </div>
      <div className="stat">
        <span className="stat-label">Trades</span>
        <span className="stat-value num">{count}</span>
      </div>
      <div className="stat">
        <span className="stat-label">Win rate</span>
        <span className="stat-value num">{winRate.toFixed(0)}%</span>
      </div>
      <div className="stat">
        <span className="stat-label">Avg win</span>
        <span className="stat-value num pos">{plainMoney(avgWin)}</span>
      </div>
      <div className="stat">
        <span className="stat-label">Avg loss</span>
        <span className="stat-value num neg">{plainMoney(avgLoss)}</span>
      </div>
    </section>
  );
}
