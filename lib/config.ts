export const ACCOUNTS = [
  { key: '5k', label: '$5K' },
  { key: '10k', label: '$10K' },
] as const;

export type AccountKey = (typeof ACCOUNTS)[number]['key'];

export const CURRENCIES = ['XAUUSD', 'XAGUSD', 'EURUSD', 'GBPUSD', 'BTCUSD'] as const;
export const TRADERS = ['Salman', 'Kumaran'] as const;
export type Trader = (typeof TRADERS)[number];

/** Minutes added to MetaTrader 5 time to get local time (210 = 3h 30m). */
export const MT5_OFFSET_MINUTES = Number(process.env.NEXT_PUBLIC_MT5_OFFSET_MINUTES ?? 210);

/** Minutes your local time is ahead of UTC (330 = India, UTC+5:30). Used for trading sessions. */
export const LOCAL_UTC_OFFSET_MINUTES = Number(process.env.NEXT_PUBLIC_LOCAL_UTC_OFFSET_MINUTES ?? 330);

export function parseAccountOrAll(v: string | undefined): AccountKey | 'all' {
  return v === '5k' || v === '10k' ? v : 'all';
}

export function parseAccount(v: string | undefined): AccountKey {
  return v === '10k' ? '10k' : '5k';
}

export function parseTrader(v: string | undefined): Trader | undefined {
  return TRADERS.find((t) => t === v);
}
