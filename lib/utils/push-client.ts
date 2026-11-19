import { deleteReminder } from '@/lib/actions/reminders'

/**
 * Best effort: remove this device's push reminder and browser subscription.
 * Called before sign-out or account deletion; never throws.
 */
export async function removeThisDevicePush() {
  try {
    const registration = await navigator.serviceWorker?.getRegistration()
    const subscription = await registration?.pushManager.getSubscription()
    if (subscription) {
      const result = await deleteReminder(subscription.endpoint)
      if (!result.error) await subscription.unsubscribe()
    }
  } catch { /* never block the caller */ }
}
