import type { SheetItem } from '@/lib/sheet';
import { formatDate, formatPrice, formatTime, signedMoney, tone } from '@/lib/format';

const COLS = 12;

export default function SheetTable({ items }: { items: SheetItem[] }) {
  return (
    <div className="sheet-wrap">
      <table className="sheet">
        <thead>
          <tr>
            <th>Date</th>
            <th>Time</th>
            <th>Currency</th>
            <th className="r">Lot size</th>
            <th>Buy / Sell</th>
            <th>Result</th>
            <th className="r">Profit / Loss</th>
            <th className="r">Entry price</th>
            <th className="r">Exit price</th>
            <th>Entry source</th>
            <th>Traded by</th>
            <th className="r">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr>
              <td colSpan={COLS} className="empty">
                No trades yet.
              </td>
            </tr>
          )}
          {items.map((it) =>
            it.kind === 'gap' ? (
              <tr key={it.key} className="gap-row">
                <td colSpan={COLS}>
                  <div className="gap">
                    <span>{it.days === 1 ? '1 day gap' : `${it.days} days gap`}</span>
                  </div>
                </td>
              </tr>
            ) : (
              <tr key={it.trade.id}>
                <td className="num">{formatDate(it.trade.trade_date)}</td>
                <td className="num">{formatTime(it.trade.trade_time)}</td>
                <td className="strong">{it.trade.currency}</td>
                <td className="num r">{it.trade.lot_size.toFixed(2)}</td>
                <td>
                  <span className={`pill pill-${it.trade.side}`}>{it.trade.side}</span>
                </td>
                <td>
                  <span className={`pill pill-${it.trade.result}`}>{it.trade.result}</span>
                </td>
                <td className={`num r strong ${it.trade.result === 'profit' ? 'pos' : 'neg'}`}>
                  {signedMoney(it.pnl)}
                </td>
                <td className="num r">{formatPrice(it.trade.entry_price)}</td>
                <td className="num r">{formatPrice(it.trade.exit_price)}</td>
                <td>{it.trade.source || <span className="muted">—</span>}</td>
                <td>{it.trade.trader}</td>
                <td className={`num r strong total ${tone(it.total)}`}>{signedMoney(it.total)}</td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}
