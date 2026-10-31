# Daily reminder deployment

Signed-in users can choose a past date on the dashboard and edit that day's
entry. The journal also links to each entry for editing. Future dates are
rejected by the save action. Day numbers follow the selected calendar date.

Daily reminders are opt-in per device, default to 18:00, and use the device's
IANA time zone when enabled or updated. The time zone handles daylight saving
changes automatically. Open Settings and save again after changing time zones.
Today's reminder is skipped if the user already saved an entry for that date.

## Enable push delivery

1. Existing Supabase projects: run
   `supabase/migrations/20261030_daily_reminders.sql` in the SQL editor.
   New projects can use `supabase-schema.sql`, which includes these tables.
2. Generate keys with `npx web-push generate-vapid-keys` and save them securely.
3. Add these environment variables locally and on the deployment host:

   ```text
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=<generated public key>
   VAPID_PRIVATE_KEY=<generated private key>
   VAPID_SUBJECT=mailto:<your real support email>
   SUPABASE_SERVICE_ROLE_KEY=<Supabase service role key>
   CRON_SECRET=<long random secret>
   ```

   Only the public VAPID key belongs in a `NEXT_PUBLIC_` variable. Keep the
   private key, service role key, and cron secret server-side. Keep VAPID keys
   stable across deployments so existing browser subscriptions keep working.
4. Deploy over HTTPS. `vercel.json` schedules `/api/reminders` every minute.
   This requires a Vercel plan that supports every-minute cron jobs. For a
   different scheduler, remove the Vercel cron configuration and call this
   endpoint every minute with `Authorization: Bearer <CRON_SECRET>`.
5. On the device, go to Settings, select a time a few minutes ahead, and tap
   **Enable notifications**. Accept browser permission. On iOS/iPadOS 16.4+,
   add TIGF to the Home Screen and open it there first.
6. Close the app and verify the notification arrives and tapping it opens the
   dashboard. Verify a saved entry suppresses that day's reminder, changing
   the time persists on reload, and turning off stops subsequent delivery.

The scheduler claims up to 100 due device reminders per invocation atomically,
preventing concurrent ticks from sending duplicates. Expired subscriptions are
removed. Transient push failures are retried on the next tick. A process crash
after claiming can lose that day's reminder; this is an at-most-once daily
nudge rather than a guaranteed delivery system. More than 100 due reminders
drain over subsequent ticks. Device/network settings can delay delivery.

References: [Next.js PWA guide](https://nextjs.org/docs/app/guides/progressive-web-apps),
[Vercel cron configuration](https://vercel.com/docs/cron-jobs/manage-cron-jobs),
[Vercel cron plan limits](https://vercel.com/docs/cron-jobs/usage-and-pricing).
