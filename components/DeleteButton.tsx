'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function DeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (!window.confirm('Delete this trade? This cannot be undone.')) return;
    setBusy(true);
    const { error } = await createClient().from('trades').delete().eq('id', id);
    setBusy(false);
    if (error) {
      window.alert(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <button type="button" className="btn btn-danger btn-sm" onClick={onDelete} disabled={busy}>
      {busy ? '…' : 'Delete'}
    </button>
  );
}
