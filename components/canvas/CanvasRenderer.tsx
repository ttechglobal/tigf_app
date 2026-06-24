'use client'

import { useRef, useState, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { drawTIGF, ensureFontsLoaded } from '@/lib/canvas/drawTIGF'
import { shareImage } from '@/lib/utils/share'

interface CanvasRendererProps {
  items: string[]
  dayNumber: number
  date: string
}

export function CanvasRenderer({ items, dayNumber, date }: CanvasRendererProps) {
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const [imgSrc, setImgSrc]         = useState<string>('')
  const [generating, setGenerating] = useState(false)
  const [shareStatus, setShareStatus] = useState('')

  const generate = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    setGenerating(true)
    setShareStatus('')

    await ensureFontsLoaded()
    drawTIGF({ ctx, items, dayNumber, date })

    // Convert to data-URL for the <img> preview
    setImgSrc(canvas.toDataURL('image/png'))
    setGenerating(false)
  }, [items, dayNumber, date])

  const download = () => {
    const canvas = canvasRef.current
    if (!canvas || !imgSrc) return
    const a = document.createElement('a')
    a.download = `tigf-day-${dayNumber}.png`
    a.href = imgSrc
    a.click()
  }

  const share = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob(async (blob) => {
      if (!blob) return
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin
      const result = await shareImage(
        blob,
        `Day ${dayNumber} — Today I'm Grateful For`,
        siteUrl
      )
      setShareStatus(
        result === 'shared'  ? '🎉 Shared!' :
        result === 'copied'  ? '📋 Caption + link copied!' :
                               '⚠ Could not share.'
      )
    }, 'image/png')
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Off-screen 1080×1080 canvas — never visible directly */}
      <canvas ref={canvasRef} width={1080} height={1080} className="sr-only" aria-hidden />

      {/* Image preview */}
      {imgSrc && (
        <div className="w-full flex justify-center">
          <img
            src={imgSrc}
            alt={`TIGF Day ${dayNumber} gratitude image`}
            className="w-full max-w-sm aspect-square rounded-2xl shadow-xl object-cover border border-[var(--border)]"
          />
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-3">
        <Button
          onClick={generate}
          loading={generating}
          variant={imgSrc ? 'secondary' : 'primary'}
          size="lg"
          className="w-full"
        >
          {imgSrc ? '↻ Regenerate image' : '✨ Generate image'}
        </Button>

        {imgSrc && (
          <div className="flex gap-3">
            <Button onClick={download} variant="secondary" size="md" className="flex-1">
              ↓ Download PNG
            </Button>
            <Button onClick={share} variant="secondary" size="md" className="flex-1">
              ↗ Share
            </Button>
          </div>
        )}
      </div>

      {shareStatus && (
        <p className="text-center text-sm font-semibold text-tigf-magenta">{shareStatus}</p>
      )}
    </div>
  )
}