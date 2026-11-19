/** Daily reminder wording. A different message each day so the nudge never feels stale. */
export interface ReminderMessage { title: string; body: string }

/** Day of the year (Jan 1 = 1) for a YYYY-MM-DD date. */
function dayOfYear(date: string): number {
  const [y, m, d] = date.split('-').map(Number)
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 1)) / 86400000) + 1
}

const MESSAGES: ((day: number) => ReminderMessage)[] = [
  () => ({ title: 'What are you grateful for today?', body: 'Take a minute to write it down.' }),
  () => ({ title: 'A moment of gratitude', body: 'What went well today? Jot it down before the day ends.' }),
  day => ({ title: `It’s Day ${day}`, body: 'What are you thankful for today?' }),
  () => ({ title: 'Count your blessings', body: 'Write down what you’re grateful for today.' }),
  () => ({ title: 'Pause and give thanks', body: 'Who or what made your day better? Write it down.' }),
  () => ({ title: 'Evening check-in', body: 'Your journal is waiting. What are you grateful for today?' }),
  () => ({ title: 'Small things matter', body: 'Even one line counts. What are you thankful for today?' }),
  () => ({ title: 'Thank God for today', body: 'What would you like to thank Him for? Pen it down.' }),
  () => ({ title: 'Keep your streak going', body: 'Write today’s gratitude entry — it only takes a minute.' }),
  () => ({ title: 'Look back on today', body: 'What’s one good thing that happened? Capture it now.' }),
]

/**
 * The reminder for a local date (YYYY-MM-DD). Index follows the calendar, so
 * consecutive days always differ and every device gets the same one that day.
 */
export function reminderMessage(date: string | null | undefined): ReminderMessage {
  const valid = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)
  const day = valid ? dayOfYear(date) : dayOfYear(new Date().toISOString().slice(0, 10))
  return MESSAGES[day % MESSAGES.length](day)
}
