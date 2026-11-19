'use client'

import { useState } from 'react'
import { EntryForm } from '@/components/dashboard/EntryForm'
import { CanvasRenderer } from '@/components/canvas/CanvasRenderer'
import { dayOfYear } from '@/lib/utils/date'

export function GuestDashboard({ date }: { date: string }) {
  const [savedItems, setSavedItems] = useState<string[]>([])
  const dayNumber = dayOfYear(date)

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
        <EntryForm date={date} initialEntry={null} isGuest={true} onSaved={setSavedItems} />
      </div>

      {savedItems.length > 0 && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 flex flex-col gap-4">
          <div>
            <h2 className="font-bold text-[var(--foreground)]">Your gratitude image</h2>
            <p className="text-sm text-[var(--muted)] mt-0.5">
              Your 1080×1080 image is ready to share — sign up to save it to your journal.
            </p>
          </div>
          <CanvasRenderer key={JSON.stringify(savedItems)} items={savedItems} dayNumber={dayNumber} date={date} />
        </div>
      )}
    </div>
  )
}