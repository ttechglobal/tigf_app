'use client'

import { useEffect, useRef } from 'react'
import { importGuestEntry } from '@/lib/actions/entries'
import { clearGuestEntry, readGuestEntry } from '@/lib/utils/guest'

/**
 * Moves an entry written as a guest into the signed-in account. Never
 * overwrites an entry that already exists for that date. Runs once per mount;
 * on failure the entry stays on the device and is retried next visit.
 */
export function GuestEntrySync() {
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    const guest = readGuestEntry()
    if (!guest) return
    importGuestEntry(guest.date, guest.items, Intl.DateTimeFormat().resolvedOptions().timeZone)
      .then(result => {
        if ('error' in result && result.error) return
        clearGuestEntry()
        // A full reload re-initialises the entry form from the freshly saved data.
        if ('entry' in result) window.location.reload()
      })
      .catch(() => { /* keep the entry for next time */ })
  }, [])

  return null
}
