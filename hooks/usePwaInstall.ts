'use client'

import { useSyncExternalStore } from 'react'

// The browser fires this event only on platforms that support a native
// install prompt (Chrome, Edge, Android). iOS Safari never fires it —
// there is no programmatic install API there, only the manual
// Share → "Add to Home Screen" flow.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// Chrome can fire beforeinstallprompt as soon as the page loads — possibly
// before any component using this hook has mounted. Attaching a listener
// at module scope captures the event into shared variables, so every
// component using usePwaInstall() sees the same state.
let capturedEvent: BeforeInstallPromptEvent | null = null
let hasFiredAppInstalled = false
const listeners = new Set<() => void>()

function notifyAll() {
  listeners.forEach(fn => fn())
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    capturedEvent = e as BeforeInstallPromptEvent
    notifyAll()
  })
  window.addEventListener('appinstalled', () => {
    hasFiredAppInstalled = true
    capturedEvent = null
    notifyAll()
  })
}

export type InstallStatus = 'unknown' | 'installed' | 'ios-manual' | 'available' | 'unavailable'

function subscribe(callback: () => void) {
  listeners.add(callback)
  return () => { listeners.delete(callback) }
}

function getSnapshot(): InstallStatus {
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
    hasFiredAppInstalled
  if (standalone) return 'installed'

  if (/iphone|ipad|ipod/i.test(window.navigator.userAgent)) return 'ios-manual'

  return capturedEvent ? 'available' : 'unavailable'
}

export function usePwaInstall() {
  const status = useSyncExternalStore<InstallStatus>(subscribe, getSnapshot, () => 'unknown')

  async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
    if (!capturedEvent) return 'unavailable'
    await capturedEvent.prompt()
    const { outcome } = await capturedEvent.userChoice
    if (outcome === 'accepted') {
      capturedEvent = null
      notifyAll()
    }
    return outcome
  }

  return { status, promptInstall }
}
