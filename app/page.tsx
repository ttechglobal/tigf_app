import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GuestBanner } from '@/components/layout/GuestBanner'
import { GuestDashboard } from '@/components/dashboard/GuestDashboard'
import { DayChangeWatcher } from '@/components/dashboard/DayChangeWatcher'
import { todayISO } from '@/lib/utils/date'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  const today = todayISO()

  return (
    <div className="flex flex-col">
      <DayChangeWatcher renderedDate={today} />
      <GuestBanner />
      <div className="max-w-2xl mx-auto w-full px-4 pt-4 pb-12 flex flex-col gap-10">
        {/* Hero */}
        <div className="text-center flex flex-col gap-3">
          <p className="text-xs font-bold tracking-[0.25em] text-tigf-magenta uppercase">Day 1 starts now</p>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--foreground)] leading-tight">
            WHAT ARE YOU<br />GRATEFUL FOR?
          </h1>
          <p className="text-[var(--muted)] max-w-sm mx-auto text-sm">
            Start your daily gratitude practice. No account needed to begin.
          </p>
        </div>

        {/* Guest form + canvas (client component handles both) */}
        <GuestDashboard date={today} />

        {/* Sign up CTA */}
        <div className="bg-tigf-magenta/5 border border-tigf-magenta/20 rounded-2xl p-6 text-center flex flex-col gap-3">
          <h2 className="font-bold text-[var(--foreground)]">Track your streak.</h2>
          <p className="text-sm text-[var(--muted)]">
            Create a free account to save your entries and keep your day count going.
          </p>
          <div className="flex gap-3 justify-center mt-2 flex-wrap">
            <Link href="/signup" className="bg-tigf-magenta text-white font-semibold px-6 py-3 rounded-xl hover:bg-tigf-magenta-dark transition-colors">
              Get started free
            </Link>
            <Link href="/login" className="border-2 border-tigf-magenta text-tigf-magenta font-semibold px-6 py-3 rounded-xl hover:bg-tigf-magenta hover:text-white transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
