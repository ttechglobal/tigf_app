'use client'

import { todayISO } from '@/lib/utils/date'
import { writeGuestEntry } from '@/lib/utils/guest'

/**
 * Guests save to this device only. The entry is imported into the account
 * the next time the person signs in (see GuestEntrySync).
 */
export function useGuestEntry() {
  const save = (items: string[]) => writeGuestEntry({ date: todayISO(), items })
  return { save }
}
