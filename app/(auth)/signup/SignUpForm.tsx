'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signUp } from '@/lib/actions/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function SignUpForm() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const result = await signUp(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }
    if (result?.needsConfirmation) {
      setSubmittedEmail(formData.get('email') as string)
      setNeedsConfirmation(true)
      setLoading(false)
    }
    // Otherwise the server action already redirected.
  }

  if (needsConfirmation) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm flex flex-col items-center gap-5 text-center">
          <div className="text-5xl">📬</div>
          <div>
            <h1 className="text-xl font-bold text-[var(--foreground)]">Check your email</h1>
            <p className="text-[var(--muted)] mt-2 text-sm leading-relaxed">
              We sent a confirmation link to <span className="font-semibold text-[var(--foreground)]">{submittedEmail}</span>.
              Click it to activate your account, then come back and sign in.
            </p>
          </div>
          <Link href="/login" className="text-tigf-magenta font-semibold hover:underline text-sm">
            Go to sign in →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-tigf.png" alt="TIGF" className="h-12 w-auto mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Start your practice</h1>
          <p className="text-[var(--muted)] mt-1 text-sm">Create your free gratitude journal</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Username" name="username" type="text" placeholder="yourname"
            required minLength={3} maxLength={30}
            pattern="[a-zA-Z0-9_]+" title="Letters, numbers and underscores only"
            autoComplete="username" />
          <Input label="Email" name="email" type="email" placeholder="you@example.com" required autoComplete="email" />
          <Input label="Password" name="password" type="password" placeholder="At least 8 characters"
            required minLength={8} autoComplete="new-password" />
          {error && <p className="text-sm text-red-500 font-medium bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl">{error}</p>}
          <Button type="submit" loading={loading} size="lg" className="w-full mt-2">Create account</Button>
        </form>
        <p className="text-center text-sm text-[var(--muted)]">
          Already have an account?{' '}
          <Link href="/login" className="text-tigf-magenta font-semibold hover:underline">Sign in →</Link>
        </p>
      </div>
    </div>
  )
}
