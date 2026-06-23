'use client'

import Link from 'next/link'
import { Sun, Moon, Settings2 } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'

interface TopHeaderProps {
  user: { email?: string | null } | null
}

export function TopHeader({ user }: TopHeaderProps) {
  const { theme, toggle, mounted } = useTheme()

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href={user ? '/dashboard' : '/'} className="shrink-0 flex items-center h-7">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-tigf.png" alt="TIGF" className="h-full w-auto" />
        </Link>

        <div className="flex items-center gap-1">
          {mounted && (
            <button
              onClick={toggle}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--muted)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          )}

          {user ? (
            <Link
              href="/settings"
              aria-label="Settings"
              className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--muted)] hover:text-tigf-magenta hover:bg-tigf-magenta/10 transition-colors"
            >
              <Settings2 size={18} />
            </Link>
          ) : (
            <div className="flex items-center gap-2 ml-1">
              <Link href="/login" className="text-sm font-semibold text-[var(--muted)] hover:text-tigf-magenta px-3 py-2 transition-colors">
                Sign in
              </Link>
              <Link href="/signup" className="text-sm font-semibold bg-tigf-magenta text-white px-4 py-2 rounded-xl hover:bg-tigf-magenta-dark transition-colors">
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}