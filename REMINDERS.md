# Daily reminder deployment with Supabase

Reminders are opt-in per device, default to 18:00, and use the device's IANA
time zone. Today's reminder is skipped if an entry is already saved. Vercel
only serves the app. Users can choose any whole hour, from midnight to 11 p.m.
Supabase Cron checks for due reminders inside Postgres every 15 minutes and
invokes the `daily-reminders` Edge Function only when there is work to send.
No due reminders means no Edge Function call. Each invocation batches users.
The 15-minute database ticks align whole local hours even in time zones with
30- or 45-minute offsets. They also pick up retries and remaining batches.

## Wording

Each day's notification text comes from `supabase/functions/_shared/messages.ts`.
The message follows the calendar day, so it changes every day and is the same on
every device. Edit that list to change the wording, then redeploy with
`supabase functions deploy daily-reminders --project-ref YOUR_PROJECT_REF --use-api`.
In Settings, "Send a test notification" shows how a reminder looks on the device
without involving the server.

## 1. Database

Existing projects: run `supabase/migrations/20261030_daily_reminders.sql` in the
Supabase SQL editor if it has not already been applied. New projects can use
`supabase-schema.sql`, which includes the reminder table and claim function.
Do not rerun the table-creation migration on a project that already has it.
For existing projects, also run `supabase/migrations/20261101_hourly_reminders.sql`.
It rounds old minute-specific preferences down to the same hour (18:35 becomes
18:00) and enforces whole-hour choices. Fresh `supabase-schema.sql` installs
already include that constraint.

## 2. Keys and function secrets

Keep any existing VAPID key pair so browser subscriptions continue to work.
For a new installation, generate one with `npx web-push generate-vapid-keys`.

On Vercel (and in `.env.local`), set only the public push key alongside the
existing public Supabase variables:

```text
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<public VAPID key>
```

In Supabase Dashboard -> Edge Functions -> Secrets, add:

```text
VAPID_PUBLIC_KEY=<same public VAPID key>
VAPID_PRIVATE_KEY=<matching private VAPID key>
VAPID_SUBJECT=mailto:<your real support email>
REMINDER_CRON_SECRET=<long random secret>
```

Supabase provides `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to hosted
Edge Functions automatically. Do not put private keys or scheduler secrets in
`NEXT_PUBLIC_` variables. The old Vercel `CRON_SECRET`, `VAPID_PRIVATE_KEY`,
`VAPID_SUBJECT`, and `SUPABASE_SERVICE_ROLE_KEY` are no longer needed by this app
and can be removed from Vercel after migrating.

## 3. Deploy the Edge Function

From the `tigf` directory:

```sh
supabase login
supabase functions deploy daily-reminders --project-ref YOUR_PROJECT_REF
```

`supabase/config.toml` disables the platform JWT check for this function.
The handler still requires `Authorization: Bearer <REMINDER_CRON_SECRET>`;
public/anonymous Supabase keys cannot authorize it. Only POST is accepted.

## 4. Schedule on Supabase

In Supabase Dashboard -> Integrations -> Vault, create these named secrets:

| Name | Value |
| --- | --- |
| `tigf_project_url` | `https://YOUR_PROJECT_REF.supabase.co` |
| `tigf_reminder_cron_secret` | Exactly the same value as `REMINDER_CRON_SECRET` above |

Then run `supabase/schedule-reminders.sql` in the Supabase SQL editor. It enables
`pg_cron` and `pg_net` and creates the `tigf-daily-reminders` job. Every 15
minutes it checks for unsent reminders whose local time is due and whose user
has not written today. Only if any exist does it call
`/functions/v1/daily-reminders` with the secret read from Vault.
Rerunning the schedule file updates the named job instead of adding another.
If you used the previous every-minute schedule, rerun this file to replace it.
This scheduling file is intentionally separate from schema migrations: deploy
the function and set secrets before starting the schedule.

`vercel.json` has no cron configuration, so no Vercel Pro plan is required for
this schedule. Redeploy the app on Vercel to remove the previous cron job and
publish the updated reminder settings action. The old `/api/reminders` route
has been removed.

## 5. Verify delivery

- Open Settings on a supported device, choose the next whole hour,
  and enable notifications. Accept browser permission. On iOS/iPadOS 16.4+,
  add TIGF to the Home Screen and open it there first.
- Close the app and verify the notification arrives and opens the dashboard.
- Verify a saved entry suppresses that day's reminder, changing the time
  persists after reload, and turning off stops subsequent delivery.
- With no due reminders, verify database ticks create no new Edge Function
  invocations. Database-only checks are separate from function invocations.
- Inspect Supabase Cron history and Edge Function logs. Cron records the HTTP
  request being queued; check the HTTP response as well to verify success:

```sql
select jobid, jobname, schedule, active from cron.job
where jobname = 'tigf-daily-reminders';

select id, status_code, timed_out, error_msg, content, created
from net._http_response order by created desc limit 10;
```

Expected function response: HTTP 200 with `sent` and `failed` counts. HTTP 401
means the Vault secret and function secret do not match; HTTP 503 means a
function secret is missing. Keep secrets out of logs and shared screenshots.
To pause reminders:

```sql
select cron.unschedule('tigf-daily-reminders');
```

The function claims up to 100 due device reminders per invocation atomically,
preventing concurrent ticks from sending duplicates. Expired subscriptions are
removed. Transient push failures are retried on the next tick. A process crash
after claiming can lose that day's reminder; delivery is a daily nudge rather
than guaranteed messaging. Larger batches drain over subsequent ticks.
Device/network settings can delay delivery. Save reminder settings again after
changing device time zones.

Local checks: `npm run test:features`; with Deno installed,
`deno check supabase/functions/daily-reminders/index.ts`.

References: [Supabase scheduled Edge Functions](https://supabase.com/docs/guides/functions/schedule-functions),
[Supabase Cron](https://supabase.com/docs/guides/cron).
