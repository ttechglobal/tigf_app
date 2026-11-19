'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { EntryCard } from '@/components/journal/EntryCard'
import { formatDateLong } from '@/lib/utils/date'
import type { StreakSummary } from '@/lib/utils/streak'
import type { Entry } from '@/types'

function monthHeading(entry: Entry) {
  const [year, month] = entry.date.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-2xl px-3 py-3 text-center">
      <p className="text-2xl font-black text-tigf-magenta">{value}</p>
      <p className="text-xs text-[var(--muted)] mt-0.5">{label}</p>
    </div>
  )
}

/** Entries arrive newest first; this adds the summary, search and month/year grouping. */
export function JournalClient({ entries, summary }: { entries: Entry[]; summary: StreakSummary }) {
  const [query, setQuery] = useState('')

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const matches = needle
      ? entries.filter(entry =>
          entry.items.some(item => item.toLowerCase().includes(needle)) ||
          formatDateLong(entry.date).toLowerCase().includes(needle))
      : entries
    const grouped: { heading: string; entries: Entry[] }[] = []
    for (const entry of matches) {
      const heading = monthHeading(entry)
      const last = grouped[grouped.length - 1]
      if (last?.heading === heading) last.entries.push(entry)
      else grouped.push({ heading, entries: [entry] })
    }
    return { grouped, count: matches.length }
  }, [entries, query])

  return (
    <>
      <div className="flex gap-3">
        <Stat value={summary.current} label="current streak" />
        <Stat value={summary.longest} label="longest streak" />
        <Stat value={summary.total} label={summary.total === 1 ? 'entry' : 'entries'} />
      </div>

      <div className="flex flex-col gap-3">
        <label htmlFor="journal-search" className="sr-only">Search your journal</label>
        <input
          id="journal-search"
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search your entries…"
          className="w-full px-4 py-3 rounded-xl border-2 bg-[var(--surface)] text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none border-[var(--border)] focus:border-tigf-magenta transition-colors"
        />
        <Link href="/dashboard" className="text-sm font-semibold text-tigf-magenta w-fit">
          Add an entry for a missed day →
        </Link>
      </div>

      <p role="status" className="sr-only">
        {query.trim() ? `${groups.count} matching ${groups.count === 1 ? 'entry' : 'entries'}` : ''}
      </p>

      {groups.count === 0 ? (
        <p className="text-center text-sm text-[var(--muted)] py-10">No entries match “{query.trim()}”.</p>
      ) : (
        groups.grouped.map(group => (
          <section key={group.heading} className="flex flex-col gap-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)] sticky top-14 z-10 bg-[var(--background)]/95 py-2">
              {group.heading}
            </h2>
            <div className="flex flex-col gap-4">
              {group.entries.map(entry => <EntryCard key={entry.id} entry={entry} />)}
            </div>
          </section>
        ))
      )}
    </>
  )
}
