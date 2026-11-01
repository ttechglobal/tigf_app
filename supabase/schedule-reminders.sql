-- Run in the Supabase SQL editor AFTER deploying daily-reminders and adding
-- tigf_project_url and tigf_reminder_cron_secret to Vault (see REMINDERS.md).
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

do $$
begin
  if not exists (select 1 from vault.decrypted_secrets where name = 'tigf_project_url')
    or not exists (select 1 from vault.decrypted_secrets where name = 'tigf_reminder_cron_secret') then
    raise exception 'Add tigf_project_url and tigf_reminder_cron_secret to Supabase Vault first.';
  end if;
end;
$$;

-- Scheduling again with the same name updates the existing job.
select cron.schedule(
  'tigf-daily-reminders',
  '*/15 * * * *',
  $job$
    -- Database-only checks cover whole-hour choices even in :30/:45 zones.
    -- Empty checks never invoke the Edge Function or read scheduler secrets.
    do $dispatch$
    begin
      if exists (
        select 1 from public.push_reminders p
        where (now() at time zone p.timezone)::time >= p.time
          and p.last_sent_date is distinct from (now() at time zone p.timezone)::date
          and not exists (select 1 from public.entries e where e.user_id = p.user_id
            and e.date = (now() at time zone p.timezone)::date)
      ) then
        perform net.http_post(
          url := (select rtrim(decrypted_secret, '/') from vault.decrypted_secrets
            where name = 'tigf_project_url') || '/functions/v1/daily-reminders',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets
              where name = 'tigf_reminder_cron_secret')
          ),
          body := '{}'::jsonb,
          timeout_milliseconds := 55000
        );
      end if;
    end;
    $dispatch$;
  $job$
);
