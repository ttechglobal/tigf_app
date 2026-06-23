/**
 * Format a date as "MON.DD.YYYY" e.g. "JUN.09.2026"
 */
export function formatDateDisplay(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date
  const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase()
  const day = String(d.getDate()).padStart(2, '0')
  const year = d.getFullYear()
  return `${month}.${day}.${year}`
}

/**
 * Format a date as "Month D, YYYY" e.g. "June 9, 2026"
 */
export function formatDateLong(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

/**
 * Today's date as YYYY-MM-DD in local time
 */
export function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * The "Day N" shown in the app — calendar day-of-year, Jan 1 = Day 1.
 * Not based on how many entries the user has written; a pure date calculation.
 * Accepts an ISO date string (YYYY-MM-DD) or a Date.
 */
export function dayOfYear(date: Date | string): number {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date
  const startOfYear = new Date(d.getFullYear(), 0, 1)
  const diffMs = d.getTime() - startOfYear.getTime()
  return Math.floor(diffMs / 86400000) + 1
}