-- Account management: edit username, delete account.
-- Run in the Supabase SQL editor on existing projects (fresh installs of
-- supabase-schema.sql already include this).

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
