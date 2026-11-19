function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export interface StreakSummary {
  /** Consecutive days ending today — or yesterday, if today isn't written yet. */
  current: number
  longest: number
  total: number
}

/**
 * Streaks from a list of entry dates (YYYY-MM-DD). `today` is the user's local
 * date, so a streak isn't broken just because today's entry is still to come.
 */
export function computeStreaks(dates: string[], today: string): StreakSummary {
  const unique = [...new Set(dates)].sort()
  const have = new Set(unique)

  let longest = 0
  let run = 0
  let previous = ''
  for (const date of unique) {
    run = previous && addDays(previous, 1) === date ? run + 1 : 1
    longest = Math.max(longest, run)
    previous = date
  }

  let cursor = have.has(today) ? today : addDays(today, -1)
  let current = 0
  while (have.has(cursor)) {
    current++
    cursor = addDays(cursor, -1)
  }

  return { current, longest, total: unique.length }
}
