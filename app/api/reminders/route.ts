import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'
import { isPushEndpoint } from '@/lib/utils/push'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key,
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: publicKey, VAPID_PRIVATE_KEY: privateKey, VAPID_SUBJECT: subject } = process.env
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
