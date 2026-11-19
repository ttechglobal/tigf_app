import { createClient } from '@/lib/supabase/server'
import { dayOfYear } from '@/lib/utils/date'
import type { Entry } from '@/types'

/**
 * Get every entry for a user, oldest first, with day numbers attached.
 * Day number is the calendar day-of-year of the entry's date (Jan 1 = Day 1),
 * not the user's entry count — so it's correct even if they skip days.
 */
export async function getAllEntries(userId: string): Promise<Entry[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true })

  // Throw instead of returning [] so a failed query never looks like an empty journal.
  if (error) throw new Error('Could not load your journal. Please try again.')
  if (!data) return []

  return (data as Entry[]).map(entry => ({
    ...entry,
    day_number: dayOfYear(entry.date),
  }))
}

/** Just the dates of every entry — cheap enough to use for streaks. */
export async function getEntryDates(userId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('entries').select('date').eq('user_id', userId)
  if (error) return [] // The streak chip is optional; never block the page on it.
  return (data ?? []).map(row => row.date as string)
}

/**
 * Get today's entry (if it exists) plus today's calendar day-of-year.
 */
export async function getTodayEntry(
  userId: string,
  todayDate: string
): Promise<{ entry: Entry | null; dayNumber: number }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId)
    .eq('date', todayDate)
    .maybeSingle()

  if (error) throw new Error('Could not load this entry. Please try again.')

  return {
    entry: (data as Entry | null) ?? null,
    dayNumber: dayOfYear(todayDate),
  }
}
