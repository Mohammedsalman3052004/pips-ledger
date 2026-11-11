'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ACCOUNTS, CURRENCIES, MT5_OFFSET_MINUTES, TRADERS, type AccountKey } from '@/lib/config';
import { mt5ToLocal, normalizeTime, todayISO } from '@/lib/time';
import { formatDate } from '@/lib/format';
import type { Trade } from '@/lib/types';

const OTHER = '__other__';

function cleanDecimal(v: string) {
  let s = v.replace(/[^0-9.]/g, '');
  const i = s.indexOf('.');
  if (i !== -1) s = s.slice(0, i + 1) + s.slice(i + 1).replace(/\./g, '');
  return s;
}

const isPreset = (c: string) => (CURRENCIES as readonly string[]).includes(c);

interface Props {
  initial?: Trade;
  defaultAccount?: AccountKey;
}

export default function TradeForm({ initial, defaultAccount = '5k' }: Props) {
  const router = useRouter();
  const editing = Boolean(initial);

  const [account, setAccount] = useState<AccountKey>(initial?.account ?? defaultAccount);
  const [date, setDate] = useState(initial?.mt5_date ?? todayISO());
  const [time, setTime] = useState(initial ? normalizeTime(initial.mt5_time) : '');
  const [currency, setCurrency] = useState(
    initial ? (isPreset(initial.currency) ? initial.currency : OTHER) : ''
  );
  const [customCurrency, setCustomCurrency] = useState(
    initial && !isPreset(initial.currency) ? initial.currency : ''
  );
  const [lot, setLot] = useState(initial ? String(initial.lot_size) : '');
  const [side, setSide] = useState<string>(initial?.side ?? '');
  const [result, setResult] = useState<string>(initial?.result ?? '');
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '');
  const [entry, setEntry] = useState(initial ? String(initial.entry_price) : '');
  const [exit, setExit] = useState(initial ? String(initial.exit_price) : '');
  const [source, setSource] = useState(initial?.source ?? '');
  const [trader, setTrader] = useState<string>(initial?.trader ?? '');

  const [busy, setBusy] = useState<'save' | 'again' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const converted = useMemo(
    () => (date && time ? mt5ToLocal(date, normalizeTime(time)) : null),
    [date, time]
  );

  const offsetLabel = `${Math.floor(MT5_OFFSET_MINUTES / 60)}h${
    MT5_OFFSET_MINUTES % 60 ? ` ${MT5_OFFSET_MINUTES % 60}m` : ''
  }`;

  async function submit(again: boolean) {
    setError(null);
    setSaved(false);

    const finalCurrency = (currency === OTHER ? customCurrency : currency).trim().toUpperCase();
    const lotN = Number(lot);
    const amountN = Number(amount);
    const entryN = Number(entry);
    const exitN = Number(exit);

    if (!date || !time) return setError('Select the date and enter the MT5 time.');
    if (!finalCurrency) return setError('Select or enter a currency.');
    if (!lot || !(lotN > 0)) return setError('Enter a valid lot size.');
    if (!side) return setError('Select Buy or Sell.');
    if (!result) return setError('Select Profit or Loss.');
    if (amount === '' || Number.isNaN(amountN)) return setError('Enter the profit / loss amount.');
    if (entry === '' || Number.isNaN(entryN)) return setError('Enter the entry price.');
    if (exit === '' || Number.isNaN(exitN)) return setError('Enter the exit price.');
    if (!trader) return setError('Select who took the trade.');

    const local = mt5ToLocal(date, normalizeTime(time));
    const payload = {
      account,
      trade_date: local.date,
      trade_time: local.time,
      mt5_date: date,
      mt5_time: normalizeTime(time),
      currency: finalCurrency,
      lot_size: lotN,
      side,
      result,
      amount: amountN,
      entry_price: entryN,
      exit_price: exitN,
      source: source.trim() || null,
      trader,
    };

    setBusy(again ? 'again' : 'save');
    const supabase = createClient();
    const { error: err } = editing
      ? await supabase
          .from('trades')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', initial!.id)
      : await supabase.from('trades').insert(payload);
    setBusy(null);

    if (err) return setError(err.message);

    if (again) {
      setTime('');
      setLot('');
      setSide('');
      setResult('');
      setAmount('');
      setEntry('');
      setExit('');
      setSource('');
      setSaved(true);
      router.refresh();
      return;
    }
    router.push(editing ? `/trades?account=${account}` : `/?account=${account}`);
    router.refresh();
  }

  return (
    <form
      className="card form"
      onSubmit={(e) => {
        e.preventDefault();
        void submit(false);
      }}
      noValidate
    >
      <div className="grid">
        <div className="field">
          <label htmlFor="account">Account</label>
          <select id="account" value={account} onChange={(e) => setAccount(e.target.value as AccountKey)}>
            {ACCOUNTS.map((a) => (
              <option key={a.key} value={a.key}>
                {a.label} account
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="trader">Traded by</label>
          <select id="trader" value={trader} onChange={(e) => setTrader(e.target.value)}>
            <option value="" disabled>
              Select trader
            </option>
            {TRADERS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="date">Date</label>
          <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        <div className="field">
          <label htmlFor="time">MT5 time</label>
          <input
            id="time"
            type="time"
            step={1}
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
          <p className="hint">
            {converted ? (
              <>
                Saved as <strong className="num">{converted.time}</strong> on{' '}
                <strong className="num">{formatDate(converted.date)}</strong>
              </>
            ) : (
              <>Enter the time shown in MT5. {offsetLabel} is added automatically.</>
            )}
          </p>
        </div>

        <div className="field">
          <label htmlFor="currency">Currency</label>
          <select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="" disabled>
              Select currency
            </option>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            <option value={OTHER}>Enter your own…</option>
          </select>
          {currency === OTHER && (
            <input
              className="mt"
              type="text"
              placeholder="e.g. USDJPY"
              autoCapitalize="characters"
              value={customCurrency}
              onChange={(e) => setCustomCurrency(e.target.value.toUpperCase())}
            />
          )}
        </div>

        <div className="field">
          <label htmlFor="lot">Lot size</label>
          <input
            id="lot"
            type="text"
            inputMode="decimal"
            placeholder="0.01"
            value={lot}
            onChange={(e) => setLot(cleanDecimal(e.target.value))}
          />
        </div>

        <div className="field">
          <label htmlFor="side">Buy or Sell</label>
          <select id="side" value={side} onChange={(e) => setSide(e.target.value)}>
            <option value="" disabled>
              Select
            </option>
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="result">Profit or Loss</label>
          <select id="result" value={result} onChange={(e) => setResult(e.target.value)}>
            <option value="" disabled>
              Select
            </option>
            <option value="profit">Profit</option>
            <option value="loss">Loss</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="amount">Amount ($)</label>
          <input
            id="amount"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(cleanDecimal(e.target.value))}
          />
          <p className="hint">Enter the number only. Profit or Loss decides the sign.</p>
        </div>

        <div className="field">
          <label htmlFor="entry">Entry price</label>
          <input
            id="entry"
            type="text"
            inputMode="decimal"
            value={entry}
            onChange={(e) => setEntry(cleanDecimal(e.target.value))}
          />
        </div>

        <div className="field">
          <label htmlFor="exit">Exit price</label>
          <input
            id="exit"
            type="text"
            inputMode="decimal"
            value={exit}
            onChange={(e) => setExit(cleanDecimal(e.target.value))}
          />
        </div>

        <div className="field span-2">
          <label htmlFor="source">Entry source</label>
          <input
            id="source"
            type="text"
            placeholder="Telegram XAUUSD, news trade, own analysis…"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}
      {saved && <div className="alert alert-ok">Trade saved. Add the next one.</div>}

      <div className="actions">
        <button className="btn btn-primary" type="submit" disabled={busy !== null}>
          {busy === 'save' ? 'Saving…' : editing ? 'Save changes' : 'Save trade'}
        </button>
        {!editing && (
          <button
            className="btn btn-secondary"
            type="button"
            disabled={busy !== null}
            onClick={() => void submit(true)}
          >
            {busy === 'again' ? 'Saving…' : 'Save and add another'}
          </button>
        )}
        <button
          className="btn btn-ghost"
          type="button"
          onClick={() => router.push(editing ? `/trades?account=${account}` : '/')}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
