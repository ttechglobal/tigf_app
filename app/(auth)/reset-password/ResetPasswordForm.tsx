'use client'

import { useState } from 'react'
import Link from 'next/link'
import { updatePassword } from '@/lib/actions/account'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { MIN_PASSWORD_LENGTH } from '@/lib/utils/limits'

export function ResetPasswordForm() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await updatePassword(new FormData(e.currentTarget))
    setLoading(false)
    if ('error' in result && result.error) setError(result.error)
    else setDone(true)
  }

  if (done) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm flex flex-col items-center gap-5 text-center">
          <div className="text-5xl">✅</div>
          <div>
            <h1 className="text-xl font-bold text-[var(--foreground)]">Password updated</h1>
            <p className="text-[var(--muted)] mt-2 text-sm">Your new password is ready to use.</p>
          </div>
          <Link href="/dashboard" className="text-tigf-magenta font-semibold hover:underline text-sm">Continue to today →</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Choose a new password</h1>
          <p className="text-[var(--muted)] mt-1 text-sm">At least {MIN_PASSWORD_LENGTH} characters.</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="New password" name="password" type="password" required minLength={MIN_PASSWORD_LENGTH} autoComplete="new-password" />
          <Input label="Confirm new password" name="confirm" type="password" required minLength={MIN_PASSWORD_LENGTH} autoComplete="new-password" />
          {error && <p role="alert" className="text-sm text-red-500 font-medium bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl">{error}</p>}
          <Button type="submit" loading={loading} size="lg" className="w-full mt-2">Update password</Button>
        </form>
      </div>
    </div>
  )
}
