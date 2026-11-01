import { createClient } from 'npm:@supabase/supabase-js@2.108.1'
// @deno-types="npm:@types/web-push@3.6.4"
import webpush from 'npm:web-push@3.6.7'
import { isPushEndpoint } from '../_shared/push.ts'

export async function handleReminderRequest(request: Request) {
  const secret = Deno.env.get('REMINDER_CRON_SECRET')
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (request.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405, headers: { Allow: 'POST' } })
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const publicKey = Deno.env.get('VAPID_PUBLIC_KEY')
  const privateKey = Deno.env.get('VAPID_PRIVATE_KEY')
  const subject = Deno.env.get('VAPID_SUBJECT')
  if (!url || !key || !publicKey || !privateKey || !subject) {
    return Response.json({ error: 'Reminder service is not configured' }, { status: 503 })
  }
  webpush.setVapidDetails(subject, publicKey, privateKey)
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await supabase.rpc('claim_due_reminders')
  if (error) return Response.json({ error: 'Could not load reminders' }, { status: 500 })
  let sent = 0
  let failed = 0
  // Bounded batches keep push service latency within the function deadline.
  for (let i = 0; i < data.length; i += 10) {
    await Promise.all(data.slice(i, i + 10).map(async (reminder: { endpoint: string; subscription: webpush.PushSubscription; last_sent_date: string }) => {
      try {
        if (!isPushEndpoint(reminder.subscription.endpoint) || reminder.subscription.endpoint !== reminder.endpoint) {
          await supabase.from('push_reminders').delete().eq('endpoint', reminder.endpoint)
          failed++
          return
        }
        await webpush.sendNotification(reminder.subscription, JSON.stringify({
          title: 'A moment of gratitude', body: 'What are you grateful for today?',
        }), { TTL: 3600, timeout: 4000 })
        sent++
      } catch (error) {
        failed++
        const status = (error as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) {
          await supabase.from('push_reminders').delete().eq('endpoint', reminder.endpoint)
        } else {
          await supabase.from('push_reminders').update({ last_sent_date: null })
            .eq('endpoint', reminder.endpoint).eq('last_sent_date', reminder.last_sent_date)
        }
      }
    }))
  }
  return Response.json({ sent, failed })
}
