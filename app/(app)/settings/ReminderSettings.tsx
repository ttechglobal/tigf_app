'use client'

import { useEffect, useState } from 'react'
import { deleteReminder, getReminder, saveReminder } from '@/lib/actions/reminders'
import { Button } from '@/components/ui/Button'

const GROUPS = [
  { label: 'Morning', hours: [5, 6, 7, 8, 9, 10, 11] },
  { label: 'Afternoon', hours: [12, 13, 14, 15, 16] },
  { label: 'Evening', hours: [17, 18, 19, 20, 21] },
  { label: 'Night', hours: [22, 23, 0, 1, 2, 3, 4] },
]

const hourValue = (hour: number) => `${String(hour).padStart(2, '0')}:00`
const hourLabel = (hour: number) => `${hour % 12 || 12}:00 ${hour < 12 ? 'AM' : 'PM'}`

export function ReminderSettings() {
  const deviceZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const [time, setTime] = useState('18:00')
  const [savedTime, setSavedTime] = useState<string | null>(null)
  const [savedZone, setSavedZone] = useState<string | null>(null)
  const [enabled, setEnabled] = useState(false)
  const [busy, setBusy] = useState(true)
  const [message, setMessage] = useState('')
  const [supported, setSupported] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const configured = Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)

  useEffect(() => {
    async function load() {
      const available = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
      setSupported(available)
      if (!available) return
      setBlocked(Notification.permission === 'denied')
      // Registered once, globally, by ServiceWorkerRegister.
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        const result = await getReminder(subscription.endpoint)
        if (result.error) throw new Error(result.error)
        if (result.reminder) {
          const loaded = `${result.reminder.time.slice(0, 2)}:00`
          setEnabled(Notification.permission === 'granted')
          setTime(loaded)
          setSavedTime(loaded)
          setSavedZone(result.reminder.timezone)
        }
      }
    }
    load().catch(() => setMessage('Could not load reminder settings. Please reload to try again.')).finally(() => setBusy(false))
  }, [])

  async function save(disable = false) {
    setBusy(true)
    setMessage('')
    try {
      // Ask directly from the button click, before waiting for service worker setup.
      if (!disable) {
        const permission = await Notification.requestPermission()
        setBlocked(permission === 'denied')
        if (permission !== 'granted') {
          throw new Error('Notifications are blocked. Allow them in your browser or phone settings, then try again.')
        }
      }
      const registration = await navigator.serviceWorker.ready
      let subscription = await registration.pushManager.getSubscription()
      if (disable) {
        if (subscription) {
          const result = await deleteReminder(subscription.endpoint)
          if (result.error) throw new Error(result.error)
          await subscription.unsubscribe()
        }
        setEnabled(false)
        setSavedTime(null)
        setSavedZone(null)
        setMessage('Daily reminder turned off on this device.')
      } else {
        if (!subscription) {
          const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
          const raw = atob(key.replace(/-/g, '+').replace(/_/g, '/'))
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true, applicationServerKey: Uint8Array.from(raw, c => c.charCodeAt(0)),
          })
        }
        const result = await saveReminder(subscription.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }, time, deviceZone)
        if (result.error) throw new Error(result.error)
        setEnabled(true)
        setSavedTime(time)
        setSavedZone(deviceZone)
        setMessage(`Done — we’ll remind you every day at ${hourLabel(Number(time.slice(0, 2)))}.`)
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update your reminder. Please try again.')
    } finally { setBusy(false) }
  }

  async function sendTest() {
    setMessage('')
    try {
      const registration = await navigator.serviceWorker.ready
      await registration.showNotification('Notifications are working', {
        body: 'This is what your daily gratitude reminder will look like.',
        icon: '/icon-192.png', tag: 'tigf-test',
      })
    } catch {
      setMessage('Could not show a test notification on this device.')
    }
  }

  const zoneChanged = enabled && savedZone !== null && savedZone !== deviceZone
  const changed = enabled && savedTime !== null && savedTime !== time
  const buttonLabel = busy ? 'Please wait…' : !enabled ? 'Enable daily reminder' : zoneChanged ? 'Update for my new time zone' : 'Save reminder time'

  return <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 flex flex-col gap-4">
    <h2 className="font-bold text-sm text-tigf-magenta uppercase tracking-wider">Daily reminder</h2>
    <p className="text-sm text-[var(--muted)]">
      Get a gentle nudge every day to write what you’re grateful for. Most people pick the late afternoon or evening.
    </p>
    <label htmlFor="reminder-time" className="text-sm font-medium">Remind me at</label>
    <select id="reminder-time" value={time} onChange={e => setTime(e.target.value)}
      className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-[var(--foreground)]">
      {GROUPS.map(group => (
        <optgroup key={group.label} label={group.label}>
          {group.hours.map(hour => <option key={hour} value={hourValue(hour)}>{hourLabel(hour)}</option>)}
        </optgroup>
      ))}
    </select>
    <p className="text-xs text-[var(--muted)]">Uses this device’s time zone ({deviceZone.replace(/_/g, ' ')}). You’ll get a reminder only if you haven’t written today’s entry yet.</p>
    <p className="text-sm text-[var(--muted)]">{enabled ? 'On for this device' : 'Off — turn it on when you’re ready'}</p>
    {!busy && !supported && <p className="text-sm">This browser doesn’t support push notifications. On iPhone or iPad, add TIGF to your Home Screen and open it there.</p>}
    {!busy && blocked && <p className="text-sm">Notifications are blocked for this site. Allow them in your browser or phone settings, then try again.</p>}
    {!configured && <p className="text-sm">Daily reminders will be available once notification setup is complete.</p>}
    {zoneChanged && <p className="text-sm">Your device time zone changed ({(savedZone ?? '').replace(/_/g, ' ')} → {deviceZone.replace(/_/g, ' ')}). Update so reminders arrive at the right local time.</p>}
    <Button disabled={busy || !supported || !configured || !time || (enabled && !changed && !zoneChanged)} onClick={() => save()}>{buttonLabel}</Button>
    {enabled && (
      <div className="flex items-center justify-between gap-4">
        <button type="button" onClick={sendTest} disabled={busy} className="text-sm font-semibold text-tigf-magenta">Send a test notification</button>
        <button type="button" disabled={busy} onClick={() => save(true)} className="text-sm font-semibold text-[var(--muted)] hover:text-red-500">Turn off</button>
      </div>
    )}
    <p role="status" className="text-sm empty:hidden">{message}</p>
  </div>
}
