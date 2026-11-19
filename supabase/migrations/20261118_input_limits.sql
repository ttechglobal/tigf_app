-- Server-side input limits that match lib/utils/limits.ts.
-- Run in the Supabase SQL editor on existing projects (fresh installs of
-- supabase-schema.sql already include these).

-- Usernames: 3-30 characters (the pattern check already exists).
alter table public.profiles drop constraint if exists profiles_username_length_max;
alter table public.profiles add constraint profiles_username_length_max
  check (char_length(username) <= 30);

-- Entries: 1-50 items, each 1-500 characters.
create or replace function public.valid_entry_items(items text[])
returns boolean language sql immutable set search_path = '' as $$
  select coalesce(array_length(items, 1), 0) between 1 and 50
    and not exists (
      select 1 from unnest(items) as i(item)
      where item is null or char_length(item) not between 1 and 500
    );
$$;

alter table public.entries drop constraint if exists entries_items_valid;
-- NOT VALID: existing rows are left alone, every new insert/update is checked.
alter table public.entries add constraint entries_items_valid
  check (public.valid_entry_items(items)) not valid;
