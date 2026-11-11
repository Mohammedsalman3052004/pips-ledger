-- Pips Ledger : run this whole file once in Supabase -> SQL Editor

create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  full_name  text,
  role       text not null default 'viewer' check (role in ('admin', 'viewer')),
  created_at timestamptz not null default now()
);

create table if not exists public.trades (
  id          uuid primary key default gen_random_uuid(),
  account     text not null check (account in ('5k', '10k')),
  -- local (converted) date & time, used for the sheet
  trade_date  date not null,
  trade_time  time not null,
  -- exactly what was typed from MetaTrader 5
  mt5_date    date not null,
  mt5_time    time not null,
  currency    text not null,
  lot_size    numeric(10,2) not null check (lot_size > 0),
  side        text not null check (side in ('buy', 'sell')),
  result      text not null check (result in ('profit', 'loss')),
  amount      numeric(14,2) not null check (amount >= 0),
  entry_price numeric(18,5) not null,
  exit_price  numeric(18,5) not null,
  source      text,
  trader      text not null check (trader in ('Salman', 'Kumaran')),
  created_by  uuid default auth.uid() references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists trades_account_time_idx
  on public.trades (account, trade_date, trade_time);

-- create a profile automatically for every new user
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Row level security: everyone logged in can read, only admins can write
alter table public.profiles enable row level security;
alter table public.trades   enable row level security;

drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles
  for select to authenticated using (true);

drop policy if exists "trades read" on public.trades;
create policy "trades read" on public.trades
  for select to authenticated using (true);

drop policy if exists "trades insert admin" on public.trades;
create policy "trades insert admin" on public.trades
  for insert to authenticated with check (public.is_admin());

drop policy if exists "trades update admin" on public.trades;
create policy "trades update admin" on public.trades
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "trades delete admin" on public.trades;
create policy "trades delete admin" on public.trades
  for delete to authenticated using (public.is_admin());

-- Table access for logged-in users (row level security above still limits writes to admins)
grant usage on schema public to authenticated;
grant select on public.profiles to authenticated;
grant select, insert, update, delete on public.trades to authenticated;
grant execute on function public.is_admin() to authenticated;

-- If users were created BEFORE running this file, create their profiles:
insert into public.profiles (id, email, full_name)
select id, email, split_part(email, '@', 1) from auth.users
on conflict (id) do nothing;

-- After creating your 4 users (Authentication -> Users), make the admins:
-- update public.profiles set role = 'admin', full_name = 'Salman'  where email = 'SALMAN_EMAIL';
-- update public.profiles set role = 'admin', full_name = 'Kumaran' where email = 'KUMARAN_EMAIL';
