import { getUser } from '@/lib/supabase/user'
import { getTodayEntry, getEntryDates, getUsername } from '@/lib/queries/entries'
import { computeStreaks } from '@/lib/utils/streak'
import { formatDateDisplay, isValidDate } from '@/lib/utils/date'
import { getTodayForRequest, getGreetingForRequest } from '@/lib/utils/request-date'
import { EntryDatePicker } from '@/components/dashboard/EntryDatePicker'
import { DashboardClient } from './DashboardClient'
import { DayChangeWatcher } from '@/components/dashboard/DayChangeWatcher'
import { GuestEntrySync } from '@/components/dashboard/GuestEntrySync'
import { GratitudeVerse } from '@/components/dashboard/GratitudeVerse'
import { DownloadAppButton } from '@/components/dashboard/DownloadAppButton'

export default async function DashboardPage({ searchParams }: {
  searchParams: Promise<{ date?: string }>
}) {
  const user = await getUser()

  const query = await searchParams
  const today = await getTodayForRequest()
  const date = query.date && isValidDate(query.date) && query.date <= today ? query.date : today
  const [{ entry, dayNumber }, entryDates, username, greeting] = user
    ? await Promise.all([
        getTodayEntry(user.id, date),
        getEntryDates(user.id),
        getUsername(user.id),
        getGreetingForRequest(),
      ])
    : [{ entry: null, dayNumber: 1 }, [] as string[], '', await getGreetingForRequest()]
  const streak = computeStreaks(entryDates, today).current

  return (
    <div className="max-w-2xl mx-auto w-full px-4 pt-10 pb-12 flex flex-col gap-10">
      <DayChangeWatcher renderedDate={today} />
      <GuestEntrySync />


      {/* Header */}
      <header className="flex flex-col items-center gap-3 text-center">
        <p className="text-xs font-bold tracking-[0.25em] text-tigf-magenta uppercase">
          {formatDateDisplay(date)}
        </p>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--foreground)] leading-tight">
          {greeting}{username ? <>,<br className="sm:hidden" /> {username}</> : ''}
        </h1>
        <p className="text-[var(--muted)] text-base">
          {date === today ? 'What are you grateful for today?' : 'What were you grateful for on this day?'}
        </p>

        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className="bg-tigf-magenta text-white font-bold text-sm px-3 py-1 rounded-full">
            Day {dayNumber}
          </span>
          {streak > 0 && (
            <span className="bg-tigf-magenta/10 text-tigf-magenta font-semibold text-sm px-3 py-1 rounded-full">
              🔥 {streak}-day streak
            </span>
          )}
        </div>

        <div className="mt-2 w-full rounded-2xl bg-tigf-magenta/5 border border-tigf-magenta/15 py-4 px-3">
          <GratitudeVerse />
        </div>
      </header>

      <EntryDatePicker date={date} today={today} />
      <DashboardClient key={date} date={date} initialEntry={entry} dayNumber={dayNumber} />

      <DownloadAppButton />
    </div>
  )
}
