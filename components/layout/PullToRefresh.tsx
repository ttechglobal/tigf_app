'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'

const THRESHOLD = 64   // px of pull needed to trigger
const MAX_PULL = 96

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
}

/**
 * iPhone home-screen apps have no browser chrome, so no reload button and no
 * pull-to-refresh. This adds both, only when running as an installed app:
 *  - pull down from the top of any page to refresh data and check for a new version
 *  - the app also checks for a new version whenever it returns to the foreground
 * When a new service worker takes over, the page reloads once so users get the
 * latest code.
 */
export function PullToRefresh() {
  const router = useRouter()
  const [pull, setPull] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef<number | null>(null)
  const pullRef = useRef(0)
  const busy = useRef(false)

  useEffect(() => {
    if (!isStandalone() || !('serviceWorker' in navigator)) return

    // Reload once when an updated service worker takes control (not on first install).
    let hadController = Boolean(navigator.serviceWorker.controller)
    const onControllerChange = () => {
      if (hadController) window.location.reload()
      hadController = true
    }
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)

    const checkForUpdate = () => {
      navigator.serviceWorker.getRegistration().then(reg => reg?.update()).catch(() => {})
    }
    const onVisible = () => { if (document.visibilityState === 'visible') checkForUpdate() }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  useEffect(() => {
    if (!isStandalone()) return

    const reset = () => { startY.current = null; pullRef.current = 0; setPull(0) }

    const onStart = (e: TouchEvent) => {
      startY.current = window.scrollY <= 0 && !busy.current ? e.touches[0].clientY : null
    }
    const onMove = (e: TouchEvent) => {
      if (startY.current === null) return
      const dy = e.touches[0].clientY - startY.current
      if (dy <= 0 || window.scrollY > 0) { reset(); return }
      pullRef.current = Math.min(dy * 0.5, MAX_PULL)
      setPull(pullRef.current)
    }
    const onEnd = async () => {
      const triggered = pullRef.current >= THRESHOLD
      reset()
      if (!triggered || busy.current) return
      busy.current = true
      setRefreshing(true)
      try {
        const reg = await navigator.serviceWorker?.getRegistration()
        await reg?.update()
      } catch { /* offline — still refresh page data below */ }
      router.refresh()
      // Brief pause so the spinner is visible; a new version reloads the page itself.
      setTimeout(() => { busy.current = false; setRefreshing(false) }, 900)
    }

    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend', onEnd)
    window.addEventListener('touchcancel', reset)
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
      window.removeEventListener('touchcancel', reset)
    }
  }, [router])

  const visible = pull > 8 || refreshing
  if (!visible) return null
  const progress = Math.min(pull / THRESHOLD, 1)

  return (
    <div
      role="status"
      aria-label={refreshing ? 'Refreshing' : 'Pull to refresh'}
      className="fixed left-0 right-0 z-40 flex justify-center pointer-events-none"
      style={{ top: 'calc(3.5rem + env(safe-area-inset-top, 0px))' }}
    >
      <div
        className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-md flex items-center justify-center text-tigf-magenta"
        style={{ transform: `translateY(${refreshing ? 12 : pull * 0.5}px)`, opacity: refreshing ? 1 : progress }}
      >
        <RefreshCw
          size={18}
          className={refreshing ? 'animate-spin' : ''}
          style={refreshing ? undefined : { transform: `rotate(${progress * 270}deg)` }}
        />
      </div>
    </div>
  )
}
