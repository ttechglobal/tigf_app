'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

/**
 * Save (or update) today's gratitude entry.
 * One entry per user per day — saving again on the same day overwrites it.
 */
export async function saveEntry(date: string, items: string[]) {
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
