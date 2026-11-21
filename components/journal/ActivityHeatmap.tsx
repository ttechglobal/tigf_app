const WEEKS = 12
const DAY_MS = 86400000

const toISO = (ms: number) => new Date(ms).toISOString().slice(0, 10)

/**
 * A GitHub-style grid of the last 12 weeks: each square is a day, filled when
 * an entry exists. Dates are plain YYYY-MM-DD strings, handled in UTC so the
 * grid never shifts with the viewer's time zone.
 */
export function ActivityHeatmap({ dates, today }: { dates: string[]; today: string }) {
  const have = new Set(dates)
  const todayMs = Date.parse(`${today}T00:00:00Z`)
  const dow = new Date(todayMs).getUTCDay() // 0 = Sunday
  const startMs = todayMs - (dow + (WEEKS - 1) * 7) * DAY_MS

  const columns = Array.from({ length: WEEKS }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const iso = toISO(startMs + (w * 7 + d) * DAY_MS)
      return { iso, future: iso > today, written: have.has(iso) }
    }))

  const written = columns.flat().filter(day => day.written).length

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-bold text-[var(--foreground)]">Last 12 weeks</h2>
        <span className="text-xs text-[var(--muted)]">
          {written} {written === 1 ? 'day' : 'days'} written
        </span>
      </div>
      <div
        role="img"
        aria-label={`${written} days written in the last 12 weeks`}
        className="flex justify-between gap-1"
      >
        {columns.map((week, w) => (
          <div key={w} className="flex flex-col gap-1 flex-1">
            {week.map(day => (
              <div
                key={day.iso}
                title={day.future ? undefined : `${day.iso}${day.written ? ' — written' : ''}`}
                className={`aspect-square rounded-[4px] ${
                  day.future
                    ? 'bg-transparent'
                    : day.written
                      ? 'bg-tigf-magenta'
                      : 'bg-[var(--border)]/60'
                }`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
