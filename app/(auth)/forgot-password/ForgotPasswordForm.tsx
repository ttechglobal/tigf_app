'use client'

import { useState } from 'react'
import Link from 'next/link'
import { requestPasswordReset } from '@/lib/actions/account'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function ForgotPasswordForm({ expired = false }: { expired?: boolean }) {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await requestPasswordReset(new FormData(e.currentTarget))
    setLoading(false)
    if ('error' in result && result.error) setError(result.error)
    else setSent(true)
  }

  if (sent) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm flex flex-col items-center gap-5 text-center">
          <div className="text-5xl">📬</div>
          <div>
            <h1 className="text-xl font-bold text-[var(--foreground)]">Check your email</h1>
            <p className="text-[var(--muted)] mt-2 text-sm leading-relaxed">
              If an account exists for that address, we’ve sent a link to reset your password.
              Open it on this device.
            </p>
          </div>
          <Link href="/login" className="text-tigf-magenta font-semibold hover:underline text-sm">Back to sign in →</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Reset your password</h1>
          <p className="text-[var(--muted)] mt-1 text-sm">We’ll email you a link to choose a new one.</p>
        </div>
        {expired && (
          <p role="status" className="text-sm text-[var(--foreground)] bg-tigf-magenta/10 px-4 py-3 rounded-xl">
            That link has expired or was already used. Request a new one below.
          </p>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Email" name="email" type="email" placeholder="you@example.com" required autoComplete="email" />
          {error && <p role="alert" className="text-sm text-red-500 font-medium bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl">{error}</p>}
          <Button type="submit" loading={loading} size="lg" className="w-full mt-2">Send reset link</Button>
        </form>
        <p className="text-center text-sm text-[var(--muted)]">
          <Link href="/login" className="text-tigf-magenta font-semibold hover:underline">← Back to sign in</Link>
        </p>
      </div>
    </div>
  )
}
