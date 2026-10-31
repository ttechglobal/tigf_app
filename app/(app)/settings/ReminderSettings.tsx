'use client'

import { useEffect, useState } from 'react'
import { deleteReminder, getReminder, saveReminder } from '@/lib/actions/reminders'
import { Button } from '@/components/ui/Button'

export function ReminderSettings() {
  const [time, setTime] = useState('18:00')
  const [enabled, setEnabled] = useState(false)
  const [busy, setBusy] = useState(true)
  const [message, setMessage] = useState('')
  const [supported, setSupported] = useState(false)
  const configured = Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)

  useEffect(() => {
    async function load() {
      const available = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
      setSupported(available)
      if (!available) return
      const registration = await navigator.serviceWorker.register('/sw.js')
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        const result = await getReminder(subscription.endpoint)
        if (result.error) throw new Error(result.error)
        if (result.reminder) {
          setEnabled(Notification.permission === 'granted')
          setTime(result.reminder.time.slice(0, 5))
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
      if (!disable && await Notification.requestPermission() !== 'granted') {
        throw new Error('Notifications are blocked. Allow them in your browser settings, then try again.')
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
        setMessage('Daily reminder turned off on this device.')
      } else {
        if (!subscription) {
          const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
          const raw = atob(key.replace(/-/g, '+').replace(/_/g, '/'))
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true, applicationServerKey: Uint8Array.from(raw, c => c.charCodeAt(0)),
          })
        }
        const result = await saveReminder(subscription.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }, time, Intl.DateTimeFormat().resolvedOptions().timeZone)
        if (result.error) throw new Error(result.error)
        setEnabled(true)
        setMessage('Daily reminder saved on this device.')
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update your reminder. Please try again.')
    } finally { setBusy(false) }
  }

  return <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 flex flex-col gap-4">
    <h2 className="font-bold text-sm text-tigf-magenta uppercase tracking-wider">Daily reminder</h2>
    <p className="text-sm text-[var(--muted)]">A gentle nudge: “What are you grateful for today?” Choose a time in your device’s local time zone.</p>
    <label htmlFor="reminder-time" className="text-sm font-medium">Reminder time</label>
    <input id="reminder-time" type="time" required value={time} onChange={e => setTime(e.target.value)}
      className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-[var(--foreground)]" />
    <p className="text-sm text-[var(--muted)]">{enabled ? 'Enabled on this device' : 'Off — enable when you’re ready'}</p>
    {!busy && !supported && <p className="text-sm">This browser does not support push notifications. On iPhone or iPad, add TIGF to your Home Screen and open it there.</p>}
    {!configured && <p className="text-sm">Daily reminders will be available once notification setup is complete.</p>}
    <Button disabled={busy || !supported || !configured || !time} onClick={() => save()}>{busy ? 'Please wait…' : enabled ? 'Save reminder time' : 'Enable notifications'}</Button>
    {enabled && <button disabled={busy} onClick={() => save(true)} className="text-sm font-semibold text-tigf-magenta">Turn off on this device</button>}
    {message && <p role="status" className="text-sm">{message}</p>}
  </div>
}
