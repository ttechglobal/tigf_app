import { isValidDate } from '@/lib/utils/date'
import type { GuestEntry } from '@/types'

export const GUEST_KEY = 'tigf-guest-entry'

/** Read the guest entry from this device, ignoring anything corrupt or malformed. */
export function readGuestEntry(): GuestEntry | null {
  try {
    const raw = localStorage.getItem(GUEST_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<GuestEntry>
    if (
      typeof parsed?.date === 'string' && isValidDate(parsed.date) &&
      Array.isArray(parsed.items) && parsed.items.length > 0 &&
      parsed.items.every(item => typeof item === 'string')
    ) {
      return { date: parsed.date, items: parsed.items }
    }
  } catch { /* storage unavailable or invalid JSON */ }
  return null
}

export function writeGuestEntry(entry: GuestEntry) {
  try { localStorage.setItem(GUEST_KEY, JSON.stringify(entry)) } catch { /* private mode */ }
}

export function clearGuestEntry() {
  try { localStorage.removeItem(GUEST_KEY) } catch { /* ignore */ }
}
