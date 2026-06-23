'use client'

import { useState } from 'react'
import { Download, X, Share2 } from 'lucide-react'
import { usePwaInstall } from '@/hooks/usePwaInstall'

const DISMISS_KEY = 'tigf-install-dismissed-session'

export function InstallPrompt() {
  const { status, promptInstall } = usePwaInstall()
  const [dismissed, setDismissed] = useState(
    () => typeof window !== 'undefined' && sessionStorage.getItem(DISMISS_KEY) === '1'
  )

  if (dismissed) return null
  if (status === 'installed' || status === 'unknown' || status === 'unavailable') return null

  const isIOS = status === 'ios-manual'

  const handleInstallClick = async () => {
    await promptInstall()
  }

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  return (
    <div className="sticky bottom-0 left-0 right-0 z-40 px-4 pb-4 pt-2">
      <div className="max-w-2xl mx-auto bg-tigf-magenta text-white rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
          {isIOS ? <Share2 size={18} /> : <Download size={18} />}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight">Install TIGF</p>
          <p className="text-xs text-white/80 leading-tight mt-0.5">
            {isIOS
              ? 'Tap Share, then "Add to Home Screen"'
              : 'Add it to your home screen for quick access'}
          </p>
        </div>

        {!isIOS && (
          <button
            onClick={handleInstallClick}
            className="shrink-0 bg-white text-tigf-magenta text-sm font-bold px-4 py-2 rounded-xl hover:bg-white/90 transition-colors"
          >
            Install
          </button>
        )}

        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}