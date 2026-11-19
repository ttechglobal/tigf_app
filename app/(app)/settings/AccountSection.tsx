'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { updateUsername } from '@/lib/actions/account'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export function AccountSection({ username, email }: { username: string; email: string }) {
  const [current, setCurrent] = useState(username)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setError('')
    startTransition(async () => {
      const result = await updateUsername(formData)
      if ('error' in result && result.error) {
        setError(result.error)
      } else if (result.username) {
        setCurrent(result.username)
        setEditing(false)
      }
    })
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 flex flex-col gap-1">
      <h2 className="font-bold text-sm text-tigf-magenta uppercase tracking-wider mb-2">Account</h2>

      {editing ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 py-2 border-b border-[var(--border)]">
          <Input label="Username" name="username" defaultValue={current} required minLength={3} maxLength={30}
            pattern="[a-zA-Z0-9_]+" title="Letters, numbers and underscores only" autoComplete="username" />
          {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-3">
            <Button type="submit" size="sm" loading={pending}>Save</Button>
            <Button type="button" size="sm" variant="ghost" disabled={pending}
              onClick={() => { setEditing(false); setError('') }}>Cancel</Button>
          </div>
        </form>
      ) : (
        <div className="flex justify-between items-center py-2 border-b border-[var(--border)]">
          <span className="text-sm text-[var(--muted)]">Username</span>
          <span className="flex items-center gap-3">
            <span className="text-sm font-medium text-[var(--foreground)]">{current || '—'}</span>
            <button type="button" onClick={() => setEditing(true)}
              className="text-sm font-semibold text-tigf-magenta">Edit</button>
          </span>
        </div>
      )}

      <div className="flex justify-between py-2 border-b border-[var(--border)]">
        <span className="text-sm text-[var(--muted)]">Email</span>
        <span className="text-sm font-medium text-[var(--foreground)]">{email}</span>
      </div>
      <div className="flex justify-between items-center py-2">
        <span className="text-sm text-[var(--muted)]">Password</span>
        <Link href="/reset-password" className="text-sm font-semibold text-tigf-magenta">Change password</Link>
      </div>
    </div>
  )
}
