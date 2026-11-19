'use client'

import { useState, useTransition } from 'react'
import { deleteAccount } from '@/lib/actions/account'
import { removeThisDevicePush } from '@/lib/utils/push-client'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export function DeleteAccount() {
  const [open, setOpen] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  function handleDelete() {
    setError('')
    startTransition(async () => {
      await removeThisDevicePush()
      // On success the action redirects to the home page.
      const result = await deleteAccount(confirmation)
      if (result?.error) setError(result.error)
    })
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)}
        className="text-sm font-semibold text-[var(--muted)] hover:text-red-500 transition-colors py-2">
        Delete my account
      </button>
    )
  }

  return (
    <div className="rounded-2xl border border-red-200 dark:border-red-900/40 p-5 flex flex-col gap-4">
      <div>
        <h2 className="font-bold text-red-600">Delete account</h2>
        <p className="text-sm text-[var(--muted)] mt-1">
          This permanently deletes your account, every journal entry and your reminders. It cannot be undone.
        </p>
      </div>
      <Input label="Type DELETE to confirm" value={confirmation} onChange={e => setConfirmation(e.target.value)}
        autoComplete="off" autoCapitalize="characters" />
      {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-3">
        <Button variant="danger" size="sm" loading={pending} disabled={confirmation !== 'DELETE'} onClick={handleDelete}>
          Delete everything
        </Button>
        <Button variant="ghost" size="sm" disabled={pending} onClick={() => { setOpen(false); setConfirmation(''); setError('') }}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
