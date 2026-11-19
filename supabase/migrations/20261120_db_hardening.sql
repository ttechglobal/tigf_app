-- Database hardening found by auditing the live project.
-- Safe to re-run. Run AFTER 20261118_input_limits.sql and 20261119_account_management.sql.

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
