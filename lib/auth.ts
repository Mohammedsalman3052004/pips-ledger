import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/lib/types';

export async function getSessionProfile() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from('profiles')
    .select('id,email,full_name,role')
    .eq('id', user.id)
    .maybeSingle();
  const profile: Profile = (data as Profile | null) ?? {
    id: user.id,
    email: user.email ?? null,
    full_name: null,
    role: 'viewer',
  };
  return profile;
}

export async function requireAdmin() {
  const profile = await getSessionProfile();
  if (!profile) redirect('/login');
  if (profile.role !== 'admin') redirect('/');
  return profile;
}
