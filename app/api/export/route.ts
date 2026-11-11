import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ACCOUNTS, parseAccount, parseTrader } from '@/lib/config';
import { toCsv, toPdf, toXlsx } from '@/lib/export';
import type { Trade } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });

  const sp = request.nextUrl.searchParams;
  const format = sp.get('format') ?? 'xlsx';
  const account = parseAccount(sp.get('account') ?? undefined);
  const trader = parseTrader(sp.get('trader') ?? undefined);

  let query = supabase
    .from('trades')
    .select('*')
    .eq('account', account)
    .order('trade_date', { ascending: true })
    .order('trade_time', { ascending: true });
  if (trader) query = query.eq('trader', trader);

  const { data, error } = await query;
  if (error) return new NextResponse(error.message, { status: 500 });
  const trades = (data ?? []) as Trade[];

  const accountLabel = ACCOUNTS.find((a) => a.key === account)!.label;
  const meta = {
    title: `Pips Ledger - ${accountLabel} account`,
    subtitle: `${trader ? `Trader: ${trader}` : 'All traders'}  |  Exported ${new Date().toISOString().slice(0, 10)}`,
  };
  const base = `pips-ledger-${account}${trader ? `-${trader.toLowerCase()}` : ''}-${new Date().toISOString().slice(0, 10)}`;

  const send = (body: Uint8Array | string, type: string, ext: string) =>
    new NextResponse(body as BodyInit, {
      headers: {
        'Content-Type': type,
        'Content-Disposition': `attachment; filename="${base}.${ext}"`,
        'Cache-Control': 'no-store',
      },
    });

  if (format === 'pdf') return send(new Uint8Array(toPdf(trades, meta)), 'application/pdf', 'pdf');
  if (format === 'csv') return send(toCsv(trades), 'text/csv; charset=utf-8', 'csv');
  return send(
    new Uint8Array(await toXlsx(trades, meta)),
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'xlsx'
  );
}
