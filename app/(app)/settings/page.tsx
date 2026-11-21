import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/user'
import { redirect } from 'next/navigation'
import { SignOutButton } from './SignOutButton'
import { AccountSection } from './AccountSection'
import { DeleteAccount } from './DeleteAccount'
import { ThemeToggleRow } from './ThemeToggleRow'
import { ReminderSettings } from './ReminderSettings'

export const metadata = { title: 'Settings' }

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--muted)] px-1">
      {children}
    </h2>
  )
}

export default async function SettingsPage() {
  const user = await getUser()
  if (!user) redirect('/login')
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .maybeSingle()

  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-10 flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-black text-[var(--foreground)]">Settings</h1>
        <p className="text-[var(--muted)] text-sm mt-1">Your account and preferences</p>
      </div>

      <section className="flex flex-col gap-3">
        <GroupLabel>Account</GroupLabel>
        <AccountSection username={profile?.username ?? ''} email={user.email ?? ''} />
      </section>

      <section className="flex flex-col gap-3">
        <GroupLabel>Preferences</GroupLabel>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 flex flex-col gap-1">
          <h3 className="font-bold text-sm text-tigf-magenta uppercase tracking-wider mb-2">
            Appearance
          </h3>
          <ThemeToggleRow />
        </div>
        <ReminderSettings />
      </section>

      <section className="flex flex-col gap-3">
        <GroupLabel>Session</GroupLabel>
        <SignOutButton />
      </section>

      <section className="flex flex-col gap-3 border-t border-[var(--border)] pt-6">
        <GroupLabel>Danger zone</GroupLabel>
        <div className="flex justify-center">
          <DeleteAccount />
        </div>
      </section>
    </div>
  )
}
