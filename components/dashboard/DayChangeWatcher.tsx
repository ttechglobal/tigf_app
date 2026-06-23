'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { todayISO } from '@/lib/utils/date'

/**
 * Watches for the browser tab becoming visible again (e.g. the user
 * switches back to this tab, or reopens their laptop) and checks whether
 * the calendar date has changed since this page was last rendered.
 *
 * If it has, calls router.refresh() — which re-runs the Server Component
 * with today's real date, updating the header, Day N badge, and entry
 * form all in one consistent pass. This covers the realistic case of
 * someone leaving the dashboard open overnight and coming back the next day.
 *
 * Renders nothing; it's a side-effect-only component.
 */
export function DayChangeWatcher({ renderedDate }: { renderedDate: string }) {
  const router = useRouter()
  const renderedDateRef = useRef(renderedDate)

  useEffect(() => {
    renderedDateRef.current = renderedDate
  }, [renderedDate])

  useEffect(() => {
    function checkForNewDay() {
      if (document.visibilityState !== 'visible') return
      if (todayISO() !== renderedDateRef.current) {
        router.refresh()
      }
    }

    document.addEventListener('visibilitychange', checkForNewDay)
    window.addEventListener('focus', checkForNewDay)

    return () => {
      document.removeEventListener('visibilitychange', checkForNewDay)
      window.removeEventListener('focus', checkForNewDay)
    }
  }, [router])

  return null
}