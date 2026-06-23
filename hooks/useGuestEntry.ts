'use client'

import { useEffect, useState } from 'react'
import { todayISO } from '@/lib/utils/date'
import type { GuestEntry } from '@/types'

const KEY = 'tigf-guest-entry'

export function useGuestEntry() {
  const [guestEntry, setGuestEntry] = useState<GuestEntry | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem(KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as GuestEntry
      // Only keep if it's for today
      if (parsed.date === todayISO()) setGuestEntry(parsed)
      else localStorage.removeItem(KEY)
    }
  }, [])

  const save = (items: string[]) => {
    const entry: GuestEntry = { date: todayISO(), items }
    localStorage.setItem(KEY, JSON.stringify(entry))
    setGuestEntry(entry)
  }

  const clear = () => {
    localStorage.removeItem(KEY)
    setGuestEntry(null)
  }

  return { guestEntry, save, clear }
}
