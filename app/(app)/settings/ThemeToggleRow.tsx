'use client'

import { useTheme } from '@/hooks/useTheme'

export function ThemeToggleRow() {
  const { theme, toggle, mounted } = useTheme()

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-[var(--muted)]">Dark mode</span>
      {mounted && (
        <button
          type="button"
          role="switch"
          aria-checked={theme === 'dark'}
          onClick={toggle}
          className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-tigf-magenta focus-visible:ring-offset-2 ${
            theme === 'dark' ? 'bg-tigf-magenta' : 'bg-[var(--border)]'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
              theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      )}
    </div>
  )
}
