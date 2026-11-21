'use client'

import { useState } from 'react'
import { EntryForm } from '@/components/dashboard/EntryForm'
import { CanvasRenderer } from '@/components/canvas/CanvasRenderer'
import type { Entry } from '@/types'

interface Props {
  date: string
  initialEntry: Entry | null
  dayNumber: number
}

export function DashboardClient({ date, initialEntry, dayNumber }: Props) {
  const [savedItems, setSavedItems] = useState<string[]>(initialEntry?.items ?? [])
  // Bumped on every save so the celebration card replays each time.
  const [saveCount, setSaveCount] = useState(0)

  const handleSaved = (items: string[]) => {
    setSavedItems(items)
    if (items.length > 0) setSaveCount(n => n + 1)
  }

  return (
    <>
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
        <EntryForm
          date={date}
          initialEntry={initialEntry}
          isGuest={false}
          onSaved={handleSaved}
        />
      </div>

      {saveCount > 0 && savedItems.length > 0 && (
        <div
          key={saveCount}
          role="status"
          className="animate-pop bg-tigf-magenta text-white rounded-2xl p-5 flex items-center gap-4"
        >
          <span aria-hidden="true" className="text-3xl">🎉</span>
          <div>
            <p className="font-black text-lg leading-tight">Day {dayNumber} captured</p>
            <p className="text-sm text-white/85 mt-0.5">
              {savedItems.length} {savedItems.length === 1 ? 'thing' : 'things'} to be thankful for. Well done.
            </p>
          </div>
        </div>
      )}

      {savedItems.length > 0 && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
          <div>
            <h2 className="font-bold text-[var(--foreground)]">Share your gratitude</h2>
            <p className="text-sm text-[var(--muted)] mt-0.5">
              Download or share your Day {dayNumber} image
            </p>
          </div>
          {/* Keyed on content so an edited entry never shows or downloads a stale image */}
          <CanvasRenderer key={JSON.stringify(savedItems)} items={savedItems} dayNumber={dayNumber} date={date} />
        </div>
      )}
    </>
  )
}
