-- Apply to existing projects before enabling daily reminders.
create or replace function public.valid_reminder_timezone(value text)
returns boolean language sql stable set search_path = '' as $$
  select exists (select 1 from pg_catalog.pg_timezone_names where name = value);
$$;

create table public.push_reminders (
  endpoint text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  subscription jsonb not null,
  time time not null default '18:00',
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
