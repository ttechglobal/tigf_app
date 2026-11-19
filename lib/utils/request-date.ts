import { cookies } from 'next/headers'
import { todayInTimezone } from '@/lib/utils/date'

export const TIMEZONE_COOKIE = 'tigf-tz'

/**
 * "Today" for the current request, in the user's own time zone.
 * The browser stores its IANA zone in a cookie (see TimezoneSync); until that
 * cookie exists, or if it holds something invalid, we fall back to UTC.
 */
export async function getTodayForRequest(): Promise<string> {
  const zone = (await cookies()).get(TIMEZONE_COOKIE)?.value
  if (zone) {
    try { return todayInTimezone(decodeURIComponent(zone)) } catch { /* fall through */ }
  }
  return todayInTimezone('UTC')
}
