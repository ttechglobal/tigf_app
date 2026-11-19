'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { drawTIGF, ensureFontsLoaded } from '@/lib/canvas/drawTIGF'
import { shareImage } from '@/lib/utils/share'

interface CanvasRendererProps {
  items: string[]
  dayNumber: number
  date: string
}

type Preview = { status: 'drawing' } | { status: 'ready'; src: string } | { status: 'failed' }

/** Draws the 1080×1080 share image as soon as it's shown, and offers download / share. */
export function CanvasRenderer({ items, dayNumber, date }: CanvasRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [preview, setPreview] = useState<Preview>({ status: 'drawing' })
  const [shareStatus, setShareStatus] = useState('')

  useEffect(() => {
    let cancelled = false
    async function draw() {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (!canvas || !ctx) return
      try {
        await ensureFontsLoaded()
        if (cancelled) return
        let host = ''
        try { host = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? '').host } catch { /* not configured */ }
        drawTIGF({ ctx, items, dayNumber, date, handle: host ? `TIGF · ${host}` : undefined })
        setPreview({ status: 'ready', src: canvas.toDataURL('image/png') })
      } catch {
        if (!cancelled) setPreview({ status: 'failed' })
      }
    }
    draw()
    return () => { cancelled = true }
  }, [items, dayNumber, date])

  const download = () => {
    if (preview.status !== 'ready') return
    const a = document.createElement('a')
    a.download = `tigf-day-${dayNumber}.png`
    a.href = preview.src
    a.click()
  }

  const share = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob(async (blob) => {
      if (!blob) return
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin
      const result = await shareImage(blob, `Day ${dayNumber} — Today I'm Grateful For`, siteUrl)
      setShareStatus(
        result === 'shared' ? 'Shared!' :
        result === 'copied' ? 'Caption and link copied to your clipboard.' :
                              'Sharing isn’t available here — try Download instead.'
      )
    }, 'image/png')
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Off-screen 1080×1080 canvas — never visible directly */}
      <canvas ref={canvasRef} width={1080} height={1080} className="sr-only" aria-hidden />

      <div className="w-full flex justify-center">
        {preview.status === 'ready' ? (
          // eslint-disable-next-line @next/next/no-img-element -- generated data URL, not optimizable
          <img
            src={preview.src}
            alt={`TIGF Day ${dayNumber} gratitude image`}
            className="w-full max-w-sm aspect-square rounded-2xl shadow-xl object-cover border border-[var(--border)]"
          />
        ) : (
          <div
            role="status"
            className="w-full max-w-sm aspect-square rounded-2xl border border-[var(--border)] bg-[var(--background)] flex items-center justify-center text-sm text-[var(--muted)] motion-safe:animate-pulse"
          >
            {preview.status === 'failed' ? 'Couldn’t create the image. Reload to try again.' : 'Creating your image…'}
          </div>
        )}
      </div>

      {preview.status === 'ready' && (
        <div className="flex gap-3">
          <Button onClick={download} variant="secondary" size="md" className="flex-1">↓ Download</Button>
          <Button onClick={share} variant="secondary" size="md" className="flex-1">↗ Share</Button>
        </div>
      )}

      <p role="status" className="text-center text-sm font-semibold text-tigf-magenta empty:hidden">{shareStatus}</p>
    </div>
  )
}
