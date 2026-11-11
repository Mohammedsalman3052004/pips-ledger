import { requireAdmin } from '@/lib/auth';
import { parseAccount } from '@/lib/config';
import TradeForm from '@/components/TradeForm';

export const metadata = { title: 'Add trade' };

export default async function NewTradePage({ searchParams }: { searchParams: { account?: string } }) {
  await requireAdmin();
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Add trade</h1>
          <p className="muted">Enter the time exactly as MetaTrader 5 shows it.</p>
        </div>
      </div>
      <TradeForm defaultAccount={parseAccount(searchParams.account)} />
    </>
  );
}
