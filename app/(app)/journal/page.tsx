import Link from 'next/link'
import { getUser } from '@/lib/supabase/user'
import { getAllEntries } from '@/lib/queries/entries'
import { getTodayForRequest } from '@/lib/utils/request-date'
import { computeStreaks } from '@/lib/utils/streak'
import { JournalClient } from './JournalClient'

export const metadata = { title: 'My Journal' }

export default async function JournalPage() {
  const user = await getUser()

  const entries = user ? await getAllEntries(user.id) : []
  const newestFirst = [...entries].reverse()
  const today = await getTodayForRequest()
  const summary = computeStreaks(entries.map(entry => entry.date), today)

  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-10 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black text-[var(--foreground)]">My Journal</h1>
        <p className="text-[var(--muted)] text-sm mt-1">
          {entries.length === 0 ? 'Your gratitude journey starts today.' : 'Everything you’ve been grateful for.'}
        </p>
      </div>

      {newestFirst.length === 0 ? (
        <div className="text-center py-16 flex flex-col gap-3">
          <div className="text-5xl">🌱</div>
          <p className="font-semibold text-[var(--foreground)]">Nothing here yet</p>
          <p className="text-sm text-[var(--muted)]">Head to Today to write your first entry.</p>
          <Link
            href="/dashboard"
            className="inline-block mt-2 bg-tigf-magenta text-white font-semibold px-6 py-3 rounded-xl hover:bg-tigf-magenta-dark transition-colors w-fit mx-auto"
          >
            Write today&apos;s entry →
          </Link>
        </div>
      ) : (
        <JournalClient entries={newestFirst} summary={summary} today={today} />
      )}
    </div>
  )
}
