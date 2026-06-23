'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="text-center flex flex-col items-center gap-5 max-w-sm">
        <div className="text-5xl">😔</div>
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)]">Something went wrong</h1>
          <p className="text-sm text-[var(--muted)] mt-2">
            {error.message || 'An unexpected error occurred.'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="bg-tigf-magenta text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-tigf-magenta-dark transition-colors text-sm"
          >
            Try again
          </button>
          <a
            href="/"
            className="border-2 border-[var(--border)] text-[var(--muted)] font-semibold px-5 py-2.5 rounded-xl hover:border-tigf-magenta hover:text-tigf-magenta transition-colors text-sm"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  )
}
