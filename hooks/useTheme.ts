'use client'

import { useSyncExternalStore } from 'react'

type Theme = 'light' | 'dark'

const THEME_EVENT = 'tigf-theme-change'

// The inline script in app/layout.tsx sets the `dark` class before hydration,
// so the DOM class is the source of truth and React just subscribes to it.
function subscribe(callback: () => void) {
  window.addEventListener(THEME_EVENT, callback)
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener(THEME_EVENT, callback)
    window.removeEventListener('storage', callback)
  }
}

const getSnapshot = (): Theme => (document.documentElement.classList.contains('dark') ? 'dark' : 'light')
const getServerSnapshot = (): Theme => 'light'

const subscribeNever = () => () => {}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  // False during server render and hydration, true afterwards.
  const mounted = useSyncExternalStore(subscribeNever, () => true, () => false)

  const toggle = () => {
    const next: Theme = theme === 'light' ? 'dark' : 'light'
    try { localStorage.setItem('tigf-theme', next) } catch { /* private mode */ }
    document.documentElement.classList.toggle('dark', next === 'dark')
    window.dispatchEvent(new Event(THEME_EVENT))
  }

  return { theme, toggle, mounted }
}
