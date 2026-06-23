import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="text-center flex flex-col items-center gap-6 max-w-sm">
        {/* Big day number style */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-bold tracking-[0.25em] text-tigf-magenta uppercase">Error</span>
          <span className="text-8xl font-black text-[var(--border)]">404</span>
        </div>

        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)]">Page not found</h1>
          <p className="text-sm text-[var(--muted)] mt-2 leading-relaxed">
            This page doesn&apos;t exist — but your gratitude practice does. Head back and keep going.
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href="/dashboard"
            className="bg-tigf-magenta text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-tigf-magenta-dark transition-colors text-sm"
          >
            Today&apos;s entry →
          </Link>
          <Link
            href="/"
            className="border-2 border-[var(--border)] text-[var(--muted)] font-semibold px-5 py-2.5 rounded-xl hover:border-tigf-magenta hover:text-tigf-magenta transition-colors text-sm"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  )
}
