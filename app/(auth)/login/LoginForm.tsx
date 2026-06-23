'use client'

import { useState } from 'react'
import Link from 'next/link'
import { logIn } from '@/lib/actions/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function LoginForm() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await logIn(new FormData(e.currentTarget))
    if (result?.error) { setError(result.error); setLoading(false) }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-tigf.png" alt="TIGF" className="h-12 w-auto mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Welcome back</h1>
          <p className="text-[var(--muted)] mt-1 text-sm">Sign in to your gratitude journal</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Email" name="email" type="email" placeholder="you@example.com" required autoComplete="email" />
          <Input label="Password" name="password" type="password" placeholder="••••••••" required autoComplete="current-password" />
          {error && <p className="text-sm text-red-500 font-medium bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl">{error}</p>}
          <Button type="submit" loading={loading} size="lg" className="w-full mt-2">Sign in</Button>
        </form>
        <p className="text-center text-sm text-[var(--muted)]">
          No account?{' '}
          <Link href="/signup" className="text-tigf-magenta font-semibold hover:underline">Create one free →</Link>
        </p>
      </div>
    </div>
  )
}
