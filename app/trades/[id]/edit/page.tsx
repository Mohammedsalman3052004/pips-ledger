import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { Trade } from '@/lib/types';
import TradeForm from '@/components/TradeForm';

export const metadata = { title: 'Edit trade' };

export default async function EditTradePage({ params }: { params: { id: string } }) {
  await requireAdmin();
  const { data } = await createClient().from('trades').select('*').eq('id', params.id).maybeSingle();
  if (!data) notFound();
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Edit trade</h1>
          <p className="muted">The MT5 time is converted again when you save.</p>
        </div>
      </div>
      <TradeForm initial={data as Trade} />
    </>
  );
}
