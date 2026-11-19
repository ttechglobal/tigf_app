'use client'

import { useTransition } from 'react'
import { logOut } from '@/lib/actions/auth'
import { deleteReminder } from '@/lib/actions/reminders'

/**
 * Signs out and first removes this device's push reminder, so the next person
 * to sign in on a shared device doesn't hit the previous account's subscription
 * and the old account stops getting notifications here.
 */
export function SignOutButton() {
  const [pending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      try {
        const registration = await navigator.serviceWorker?.getRegistration()
        const subscription = await registration?.pushManager.getSubscription()
        if (subscription) {
          const result = await deleteReminder(subscription.endpoint)
          if (!result.error) await subscription.unsubscribe()
        }
      } catch {
        // Best effort — never block signing out.
      }
      await logOut()
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="w-full text-center text-sm font-semibold text-red-500 hover:text-red-600 transition-colors py-3 rounded-xl border border-red-200 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-900/10 disabled:opacity-50"
    >
      {pending ? 'Signing out…' : 'Sign out'}
    </button>
  )
}
