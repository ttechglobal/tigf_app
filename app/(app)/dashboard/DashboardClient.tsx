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

  return (
    <>
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl px-6 py-4">
        <EntryForm
          date={date}
          initialEntry={initialEntry}
          isGuest={false}
          onSaved={setSavedItems}
        />
      </div>

      {savedItems.length > 0 && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 flex flex-col gap-4">
          <div>
            <h2 className="font-bold text-[var(--foreground)]">Share your gratitude</h2>
            <p className="text-sm text-[var(--muted)] mt-0.5">
              Generate a shareable image for Day {dayNumber}
            </p>
          </div>
          <CanvasRenderer items={savedItems} dayNumber={dayNumber} date={date} />
        </div>
      )}
    </>
  )
}
