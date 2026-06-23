import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { logOut } from '@/lib/actions/auth'
import { ThemeToggleRow } from './ThemeToggleRow'

export const metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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

      {/* Account info */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 flex flex-col gap-1">
        <h2 className="font-bold text-sm text-tigf-magenta uppercase tracking-wider mb-2">
          Account
        </h2>
        <div className="flex justify-between py-2 border-b border-[var(--border)]">
          <span className="text-sm text-[var(--muted)]">Username</span>
          <span className="text-sm font-medium text-[var(--foreground)]">
            {profile?.username ?? '—'}
          </span>
        </div>
        <div className="flex justify-between py-2">
          <span className="text-sm text-[var(--muted)]">Email</span>
          <span className="text-sm font-medium text-[var(--foreground)]">{user.email}</span>
        </div>
      </div>

      {/* Appearance */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 flex flex-col gap-1">
        <h2 className="font-bold text-sm text-tigf-magenta uppercase tracking-wider mb-2">
          Appearance
        </h2>
        <ThemeToggleRow />
      </div>

      {/* Sign out */}
      <form action={logOut}>
        <button
          type="submit"
          className="w-full text-center text-sm font-semibold text-red-500 hover:text-red-600 transition-colors py-3 rounded-xl border border-red-200 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-900/10"
        >
          Sign out
        </button>
      </form>
    </div>
  )
}
