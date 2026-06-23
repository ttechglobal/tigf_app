-- =============================================
-- TIGF — Supabase Database Schema (simple version)
-- Run this in the Supabase SQL editor
-- =============================================

-- Profiles table (extends auth.users)
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text unique not null check (length(username) >= 3 and username ~ '^[a-zA-Z0-9_]+$'),
  created_at  timestamptz default now()
);

-- Entries table — one row per user per day
create table public.entries (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  date         date not null,
  items        text[] not null default '{}',
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

-- Index for fast "all my entries, oldest first" queries
create index entries_user_date on public.entries(user_id, date);

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
