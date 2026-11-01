-- Existing minute-specific preferences move to the start of the same hour.
update public.push_reminders
set time = make_time(extract(hour from time)::int, 0, 0)
where extract(minute from time) <> 0 or extract(second from time) <> 0;

do $$
begin
  if not exists (select 1 from pg_constraint
    where conrelid = 'public.push_reminders'::regclass and conname = 'push_reminders_whole_hour') then
    alter table public.push_reminders add constraint push_reminders_whole_hour
      check (extract(minute from time) = 0 and extract(second from time) = 0 and time < time '24:00');
  end if;
end;
$$;
