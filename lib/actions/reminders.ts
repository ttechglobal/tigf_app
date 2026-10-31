'use server'

import { createClient } from '@/lib/supabase/server'
import { isPushEndpoint } from '@/lib/utils/push'

export async function getReminder(endpoint: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('push_reminders').select('time,timezone').eq('endpoint', endpoint).maybeSingle()
  return { reminder: data, error: error ? 'Could not load reminder settings.' : undefined }
}

export async function saveReminder(subscription: { endpoint: string; keys?: { p256dh?: string; auth?: string } }, time: string, timezone: string) {
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return { error: 'Reminders have not been configured yet.' }
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return { error: 'Choose a valid time.' }
  try { new Intl.DateTimeFormat('en', { timeZone: timezone }).format() } catch { return { error: 'Invalid time zone.' } }
  if (!isPushEndpoint(subscription.endpoint)) return { error: 'Unsupported push notification provider.' }
  if (!subscription.keys?.auth || !subscription.keys.p256dh || subscription.endpoint.length > 4096) return { error: 'Invalid notification subscription.' }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Please sign in again.' }
  const { error } = await supabase.from('push_reminders').upsert({
    endpoint: subscription.endpoint, user_id: user.id, subscription, time, timezone,
  }, { onConflict: 'endpoint' })
  return { error: error ? 'Could not save your reminder. Please try again.' : undefined }
}

export async function deleteReminder(endpoint: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('push_reminders').delete().eq('endpoint', endpoint)
  return { error: error ? 'Could not turn off your reminder. Please try again.' : undefined }
}
