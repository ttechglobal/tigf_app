'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const COOKIE = 'tigf-tz'

/**
 * Keeps a cookie with the browser's IANA time zone so server components can
 * compute the user's real "today". Refreshes once when the zone first appears
 * or changes (e.g. after travelling).
 */
export function TimezoneSync() {
  const router = useRouter()

  useEffect(() => {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (!zone) return
    const current = document.cookie.split('; ').find(c => c.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1)
    if (current && decodeURIComponent(current) === zone) return
    document.cookie = `${COOKIE}=${encodeURIComponent(zone)}; path=/; max-age=31536000; samesite=lax`
    router.refresh()
  }, [router])

  return null
}
