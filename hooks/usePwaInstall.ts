'use client'

import { useEffect, useState } from 'react'

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
// here, at module scope, runs the moment this file is first imported,
// which is as early as we can realistically hook in from a Next.js client
// component. Whichever fires first — this module-level listener or the
// one inside the hook — the event gets captured into this shared variable,
// so every component using usePwaInstall() sees the same state.
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

export function usePwaInstall() {
  const [status, setStatus] = useState<InstallStatus>('unknown')

  useEffect(() => {
    function computeStatus(): InstallStatus {
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        hasFiredAppInstalled
      if (standalone) return 'installed'

      const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent)
      if (isIOS) return 'ios-manual'

      return capturedEvent ? 'available' : 'unavailable'
    }

    setStatus(computeStatus())

    function handleChange() {
      setStatus(computeStatus())
    }

    listeners.add(handleChange)
    window.addEventListener('beforeinstallprompt', handleChange)
    window.addEventListener('appinstalled', handleChange)
    return () => {
      listeners.delete(handleChange)
      window.removeEventListener('beforeinstallprompt', handleChange)
      window.removeEventListener('appinstalled', handleChange)
    }
  }, [])

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