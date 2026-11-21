/** Time-of-day greeting for a given hour (0-23). */
export function greetingForHour(hour: number): string {
  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 17) return 'Good afternoon'
  if (hour >= 17 && hour < 22) return 'Good evening'
  return 'Hello, night owl'
}

/** The current hour (0-23) in an IANA time zone. */
export function hourInTimezone(timeZone: string): number {
  const hour = new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', hourCycle: 'h23' })
    .formatToParts(new Date())
    .find(p => p.type === 'hour')!.value
  return Number(hour) % 24
}
