import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

/**
 * The signed-in user for this request. Wrapped in React's per-request cache so
 * the layout, page and nested layouts share one Supabase Auth round trip
 * instead of each making their own.
 */
export const getUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})
