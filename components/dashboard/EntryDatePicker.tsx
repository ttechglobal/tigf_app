'use client'

import { useRouter } from 'next/navigation'

export function EntryDatePicker({ date, today }: { date: string; today: string }) {
  const router = useRouter()
  function select(value: string) {
    if (!value || value > today) return
    const url = new URL(window.location.href)
    url.searchParams.set('date', value)
    router.push(url.pathname + url.search)
  }
  return <div className="flex flex-col gap-2">
    <div className="flex gap-3 items-center justify-between flex-wrap">
      <label htmlFor="entry-date" className="text-sm font-semibold">Entry date</label>
      <div className="flex gap-3 items-center">
        {date !== today && <button type="button" onClick={() => select(today)} className="text-sm font-semibold text-tigf-magenta">Back to today</button>}
        <input id="entry-date" type="date" value={date} max={today} onChange={e => select(e.target.value)}
          className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)]" />
      </div>
    </div>
    <p className="text-xs text-[var(--muted)]">Missed a day? Pick an earlier date — existing entries open for editing.</p>
  </div>
}
