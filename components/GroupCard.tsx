import { MIN_SAMPLE, type Group } from '@/lib/analysis';
import { signedMoney, tone } from '@/lib/format';

export default function GroupCard({
  title,
  note,
  groups,
  nameHeader,
}: {
  title: string;
  note?: string;
  groups: Group[];
  nameHeader: string;
}) {
  return (
    <section className="card gcard">
      <div className="gcard-head">
        <h2>{title}</h2>
        {note && <p className="muted">{note}</p>}
      </div>
      <div className="gtable-wrap">
        <table className="gtable">
          <thead>
            <tr>
              <th>{nameHeader}</th>
              <th className="r">Trades</th>
              <th>Win rate</th>
              <th className="r">Net result</th>
            </tr>
          </thead>
          <tbody>
            {groups.length === 0 && (
              <tr>
                <td colSpan={4} className="empty">
                  No data yet.
                </td>
              </tr>
            )}
            {groups.map((g) => {
              const low = g.trades < MIN_SAMPLE;
              return (
                <tr key={g.key} className={low ? 'low' : undefined} title={low ? `Fewer than ${MIN_SAMPLE} trades` : undefined}>
                  <td className="strong">{g.label}</td>
                  <td className="num r">{g.trades}</td>
                  <td>
                    {g.trades === 0 ? (
                      <span className="muted">-</span>
                    ) : (
                      <div className="wr">
                        <span className="bar">
                          <i className={g.winRate >= 50 ? 'ok' : 'bad'} style={{ width: `${g.winRate}%` }} />
                        </span>
                        <span className="num">{g.winRate.toFixed(0)}%</span>
                      </div>
                    )}
                  </td>
                  <td className={`num r strong ${g.trades ? tone(g.net) : 'zero'}`}>
                    {g.trades ? signedMoney(g.net) : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
