import type { AccountKey, Trader } from '@/lib/config';

export default function ExportMenu({ account, trader }: { account: AccountKey; trader?: Trader }) {
  const q = (format: string) => {
    const p = new URLSearchParams({ format, account });
    if (trader) p.set('trader', trader);
    return `/api/export?${p.toString()}`;
  };
  return (
    <details className="export">
      <summary className="btn btn-secondary">
        Download
        <svg width="11" height="7" viewBox="0 0 12 8" aria-hidden>
          <path d="M1 1l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </summary>
      <div className="export-menu">
        <a href={q('xlsx')} download>
          <strong>Excel sheet</strong>
          <span>.xlsx with colours</span>
        </a>
        <a href={q('pdf')} download>
          <strong>PDF</strong>
          <span>Print-ready table</span>
        </a>
        <a href={q('csv')} download>
          <strong>CSV</strong>
          <span>Opens in Google Sheets</span>
        </a>
      </div>
    </details>
  );
}
