'use client'

import { useState } from 'react'
import { Download, Check, Share2 } from 'lucide-react'
import { usePwaInstall } from '@/hooks/usePwaInstall'

export function DownloadAppButton() {
  const { status, promptInstall } = usePwaInstall()
  const [justAccepted, setJustAccepted] = useState(false)
  const [showIOSHint, setShowIOSHint] = useState(false)
  const [showWaitHint, setShowWaitHint] = useState(false)

  // Already installed — nothing to offer.
  if (status === 'installed') return null

  const handleClick = async () => {
    if (status === 'ios-manual') {
      setShowIOSHint(true)
      return
    }

    if (status === 'available') {
      const outcome = await promptInstall()
      if (outcome === 'accepted') setJustAccepted(true)
      return
    }

    // status === 'unavailable' or 'unknown' — the browser hasn't offered
    // an install prompt yet (often needs a moment, or a second visit).
    // Be honest about this instead of pretending the button did something.
    setShowWaitHint(true)
  }

  if (justAccepted) {
    return (
      <div className="flex items-center justify-center gap-2 text-tigf-magenta font-semibold text-sm">
        <Check size={18} />
        Installed! Look for TIGF on your home screen.
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-2 bg-tigf-magenta text-white font-semibold px-6 py-3 rounded-xl hover:bg-tigf-magenta-dark transition-colors"
      >
        <Download size={18} />
        Download the app
      </button>

      {showIOSHint && (
        <p className="flex items-center gap-1.5 text-xs text-[var(--muted)] text-center max-w-xs">
          <Share2 size={14} className="shrink-0" />
          Tap the Share button in Safari, then "Add to Home Screen"
        </p>
      )}

      {showWaitHint && (
        <p className="text-xs text-[var(--muted)] text-center max-w-xs">
          Your browser hasn't offered install yet — try reloading the page,
          or use your browser menu and look for "Install app" / "Add to Home Screen".
        </p>
      )}
    </div>
  )
}