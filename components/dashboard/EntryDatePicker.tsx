'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function EntryDatePicker({ date, today }: { date: string; today: string }) {
  const router = useRouter()
  useEffect(() => {
    const url = new URL(window.location.href)
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (url.searchParams.get('tz') !== tz) {
      url.searchParams.set('tz', tz)
      router.replace(url.pathname + url.search)
    }
  }, [router])
  function select(value: string) {
    if (!value || value > today) return
    const url = new URL(window.location.href)
    url.searchParams.set('date', value)
    router.push(url.pathname + url.search)
  }
  return <div className="flex flex-col gap-2">
    <label htmlFor="entry-date" className="text-sm font-semibold">Entry date</label>
    <div className="flex gap-3 items-center">
      <input id="entry-date" type="date" value={date} max={today} onChange={e => select(e.target.value)}
        className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-[var(--foreground)]" />
      {date !== today && <button onClick={() => select(today)} className="text-sm font-semibold text-tigf-magenta">Back to today</button>}
    </div>
    <p className="text-sm text-[var(--muted)]">Missed a day? Choose a past date to catch up. Existing entries will open for editing.</p>
  </div>
}
