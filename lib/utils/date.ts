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
export function isValidDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && Number(date.slice(0, 4)) >= 1 &&
    !Number.isNaN(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date
}

export function todayInTimezone(timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date())
  const part = (type: string) => parts.find(p => p.type === type)!.value
  return `${part('year')}-${part('month')}-${part('day')}`
}

export function dayOfYear(date: Date | string): number {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date
  const startOfYear = Date.UTC(d.getFullYear(), 0, 1)
  const diffMs = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - startOfYear
  return Math.floor(diffMs / 86400000) + 1
}
