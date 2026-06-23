import { createClient } from '@/lib/supabase/server'
import { getAllEntries } from '@/lib/queries/entries'
import { EntryCard } from '@/components/journal/EntryCard'

export const metadata = { title: 'My Journal' }

export default async function JournalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const entries = user ? await getAllEntries(user.id) : []
  const reversed = [...entries].reverse() // newest first

  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-10 flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-black text-[var(--foreground)]">My Journal</h1>
        <p className="text-[var(--muted)] text-sm mt-1">
          {entries.length === 0
            ? 'Your gratitude journey starts today.'
            : `${entries.length} entr${entries.length === 1 ? 'y' : 'ies'} logged`}
        </p>
      </div>

      {reversed.length === 0 ? (
        <div className="text-center py-16 flex flex-col gap-3">
          <div className="text-5xl">🌱</div>
          <p className="font-semibold text-[var(--foreground)]">Nothing here yet</p>
          <p className="text-sm text-[var(--muted)]">Head to Today to write your first entry.</p>
          <a
            href="/dashboard"
            className="inline-block mt-2 bg-tigf-magenta text-white font-semibold px-6 py-3 rounded-xl hover:bg-tigf-magenta-dark transition-colors w-fit mx-auto"
          >
            Write today&apos;s entry →
          </a>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {reversed.map(entry => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  )
}
