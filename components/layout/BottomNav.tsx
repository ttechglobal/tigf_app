'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sun, NotebookText, ShoppingBag } from 'lucide-react'

interface BottomNavProps {
  user: { email?: string | null } | null
}

const NAV = [
  { href: '/dashboard', label: 'Today', Icon: Sun },
  { href: '/journal', label: 'Journal', Icon: NotebookText },
  { href: '/shop', label: 'MyMusings', Icon: ShoppingBag },
]

/**
 * Bottom tab bar — rendered AFTER page content in the DOM (see app/layout.tsx),
 * not before it. This matters: a fixed-position element doesn't take up layout
 * space wherever it's placed in the DOM, so the "spacer" that creates clearance
 * for it must be a sibling of the actual page content, not something injected
 * above the page by a component that renders before <main>.
 */
export function BottomNav({ user }: BottomNavProps) {
  const pathname = usePathname()

  if (!user) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--background)]/95 backdrop-blur-sm border-t border-[var(--border)] safe-bottom">
      <div className="max-w-md mx-auto flex">
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5"
            >
              <span
                className={`flex items-center justify-center w-12 h-8 rounded-full transition-colors duration-150 ${
                  active ? 'bg-tigf-magenta/15' : ''
                }`}
              >
                <Icon
                  size={22}
                  strokeWidth={active ? 2.25 : 1.75}
                  className={active ? 'text-tigf-magenta' : 'text-[var(--muted)]'}
                />
              </span>
              <span className={`text-[11px] font-semibold transition-colors duration-150 ${
                active ? 'text-tigf-magenta' : 'text-[var(--muted)]'
              }`}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}