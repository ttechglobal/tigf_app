-- =============================================
-- TIGF — Supabase Database Schema (simple version)
-- Run this in the Supabase SQL editor
-- =============================================

-- Profiles table (extends auth.users)
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text unique not null check (char_length(username) between 3 and 30 and username ~ '^[a-zA-Z0-9_]+$'),
  created_at  timestamptz default now()
);

-- 1-50 items per entry, each 1-500 characters (matches lib/utils/limits.ts)
create or replace function public.valid_entry_items(items text[])
returns boolean language sql immutable set search_path = '' as $$
  select coalesce(array_length(items, 1), 0) between 1 and 50
    and not exists (
      select 1 from unnest(items) as i(item)
      where item is null or char_length(item) not between 1 and 500
    );
$$;

-- Entries table — one row per user per day
create table public.entries (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  date         date not null,
  items        text[] not null default '{}' constraint entries_items_valid check (public.valid_entry_items(items)),
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  unique(user_id, date)
);

-- Auto-update updated_at on every edit
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger entries_updated_at
  before update on public.entries
  for each row execute function update_updated_at();


-- =============================================
-- Row Level Security — users can only touch their own data
-- =============================================

alter table public.profiles enable row level security;
alter table public.entries enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users manage their own entries"
  on public.entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =============================================
-- Auto-create profile on signup
-- =============================================
-- This trigger fires the instant a row lands in auth.users — before email
-- confirmation, and independent of the client's session/RLS state. This is
-- what guarantees every signed-up user has a profiles row, no matter how
-- "Confirm email" is configured in Auth settings. Don't skip this.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  desired_username text;
begin
  desired_username := coalesce(
    new.raw_user_meta_data->>'username',
    'user_' || substr(new.id::text, 1, 8)
  );

  insert into public.profiles (id, username)
  values (new.id, desired_username)
  on conflict (id) do nothing;

  return new;
exception
  when unique_violation then
    insert into public.profiles (id, username)
    values (new.id, desired_username || '_' || substr(new.id::text, 1, 4))
    on conflict (id) do nothing;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
-- Apply to existing projects before enabling daily reminders.
create or replace function public.valid_reminder_timezone(value text)
returns boolean language sql stable set search_path = '' as $$
  select exists (select 1 from pg_catalog.pg_timezone_names where name = value);
$$;

create table public.push_reminders (
  endpoint text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  subscription jsonb not null,
  time time not null default '18:00' constraint push_reminders_whole_hour
    check (extract(minute from time) = 0 and extract(second from time) = 0 and time < time '24:00'),
  timezone text not null default 'UTC' check (public.valid_reminder_timezone(timezone)),
  last_sent_date date
);
alter table public.push_reminders enable row level security;
create policy "Users manage their own reminders" on public.push_reminders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Atomically claim due reminders, including missed scheduler ticks today.
-- Avoid reminders once today's entry is already saved.
create or replace function public.claim_due_reminders()
returns setof public.push_reminders
language sql security definer set search_path = public as $$
  update public.push_reminders r
  set last_sent_date = (now() at time zone r.timezone)::date
  where r.endpoint in (
    select p.endpoint from public.push_reminders p
    where (now() at time zone p.timezone)::time >= p.time
      and p.last_sent_date is distinct from (now() at time zone p.timezone)::date
      and not exists (select 1 from public.entries e where e.user_id = p.user_id
        and e.date = (now() at time zone p.timezone)::date)
    order by p.endpoint limit 100 for update skip locked
  ) returning r.*;
$$;
revoke all on function public.claim_due_reminders() from public, anon, authenticated;
grant execute on function public.claim_due_reminders() to service_role;

-- =============================================
-- Account management: edit username, delete account
-- =============================================
-- Users may change their own username, and nothing else on the profile.
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

revoke update on public.profiles from anon, authenticated;
grant update (username) on public.profiles to authenticated;

-- Lets a signed-in user delete their own account. Deleting the auth user
-- cascades to profiles, entries and push_reminders.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- =============================================
-- Hardening (see supabase/migrations/20261120_db_hardening.sql)
-- =============================================
-- 1. Duplicate index: entries_user_id_date_key (UNIQUE user_id, date) already serves
--    every query entries_user_date does, so the extra index only slows writes.
drop index if exists public.entries_user_date;

-- 2. Fixed search_path for the updated_at trigger function.
alter function public.update_updated_at() set search_path = '';

-- 3. The signup trigger function must not be callable through the API (/rest/v1/rpc).
--    The trigger keeps working: it runs as the function owner.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.update_updated_at() from public, anon, authenticated;

-- 4. Least privilege. The app never uses the anon role for table access, and
--    signed-in users never need TRUNCATE, TRIGGER or REFERENCES.
revoke all on public.entries from anon;
revoke all on public.profiles from anon;
revoke truncate, trigger, references on public.entries from authenticated;
revoke truncate, trigger, references on public.profiles from authenticated;

-- 5. Row-level security policies: authenticated users only, and auth.uid() wrapped
--    in a subselect so Postgres evaluates it once per query instead of once per row.
drop policy if exists "Users manage their own entries" on public.entries;
create policy "Users manage their own entries"
  on public.entries for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- push_reminders (created by 20261030_daily_reminders.sql) gets the same treatment when present.
do $$
begin
  if to_regclass('public.push_reminders') is not null then
    drop policy if exists "Users manage their own reminders" on public.push_reminders;
    create policy "Users manage their own reminders"
      on public.push_reminders for all to authenticated
      using ((select auth.uid()) = user_id)
      with check ((select auth.uid()) = user_id);
    revoke all on public.push_reminders from anon;
    revoke truncate, trigger, references on public.push_reminders from authenticated;
    create index if not exists push_reminders_user_id_idx on public.push_reminders (user_id);
  end if;
end;
$$;
