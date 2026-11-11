import type { AccountKey, Trader } from './config';

export interface Trade {
  id: string;
  account: AccountKey;
  trade_date: string; // YYYY-MM-DD (converted)
  trade_time: string; // HH:MM:SS (converted)
  mt5_date: string;
  mt5_time: string;
  currency: string;
  lot_size: number;
  side: 'buy' | 'sell';
  result: 'profit' | 'loss';
  amount: number;
  entry_price: number;
  exit_price: number;
  source: string | null;
  trader: Trader;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: 'admin' | 'viewer';
}
