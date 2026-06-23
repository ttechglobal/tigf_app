import Link from 'next/link'

export function GuestBanner() {
  return (
    <div className="w-full bg-tigf-magenta/10 border-b border-tigf-magenta/20 px-4 py-3">
      <p className="text-center text-sm text-tigf-magenta font-medium">
        ✨ Sign in to save your gratitude entries and sync across devices.{' '}
        <Link href="/signup" className="font-bold underline underline-offset-2 hover:opacity-80">
          Create a free account →
        </Link>
      </p>
    </div>
  )
}
