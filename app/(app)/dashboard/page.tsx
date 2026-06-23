import { createClient } from '@/lib/supabase/server'
import { getTodayEntry } from '@/lib/queries/entries'
import { todayISO, formatDateDisplay } from '@/lib/utils/date'
import { DashboardClient } from './DashboardClient'
import { DayChangeWatcher } from '@/components/dashboard/DayChangeWatcher'
import { GratitudeVerse } from '@/components/dashboard/GratitudeVerse'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const today = todayISO()
  const { entry, dayNumber } = user
    ? await getTodayEntry(user.id, today)
    : { entry: null, dayNumber: 1 }

  return (
    <div className="max-w-2xl mx-auto w-full px-4 pt-3 pb-6 flex flex-col gap-6">
      <DayChangeWatcher renderedDate={today} />

     

      {/* Header */}
      <div className="flex flex-col gap-2 text-center">
        <p className="text-xs font-bold tracking-[0.25em] text-tigf-magenta uppercase">
          {formatDateDisplay(today)}
        </p>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--foreground)]">
          WHAT ARE YOU GRATEFUL FOR?
        </h1>
        <div className="flex items-center justify-center gap-2 mt-1">
          <span className="text-[var(--muted)] text-sm">Today is</span>
          <span className="bg-tigf-magenta text-white font-bold text-sm px-3 py-1 rounded-full">
            Day {dayNumber}
          </span>
        </div>
      </div>

       <GratitudeVerse />

      <DashboardClient date={today} initialEntry={entry} dayNumber={dayNumber} />
    </div>
  )
}