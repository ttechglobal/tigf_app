'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { isValidDate, todayInTimezone } from '@/lib/utils/date'

/**
 * Save (or update) a gratitude entry for today or a past date.
 * One entry per user per day — saving again on the same day overwrites it.
 */
export async function saveEntry(date: string, items: string[], timeZone = 'UTC') {
  let today: string
  try { today = todayInTimezone(timeZone) } catch { return { error: 'Invalid time zone.' } }
  if (!isValidDate(date) || date > today) return { error: 'Choose today or a past date.' }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const filtered = items.map(i => i.trim()).filter(Boolean)
  if (filtered.length === 0) return { error: 'Add at least one thing.' }

  const { data, error } = await supabase
    .from('entries')
    .upsert(
      { user_id: user.id, date, items: filtered },
      { onConflict: 'user_id,date' }
    )
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/journal')
  return { entry: data }
}
