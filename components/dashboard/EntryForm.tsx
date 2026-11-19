'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import { saveEntry, deleteEntry } from '@/lib/actions/entries'
import { useGuestEntry } from '@/hooks/useGuestEntry'
import { MAX_ITEMS, MAX_ITEM_LENGTH } from '@/lib/utils/limits'
import type { Entry } from '@/types'

interface EntryFormProps {
  date: string
  initialEntry: Entry | null
  isGuest: boolean
  onSaved?: (items: string[]) => void
}

export function EntryForm({ date, initialEntry, isGuest, onSaved }: EntryFormProps) {
  const { save: saveGuest } = useGuestEntry()
  const [items, setItems] = useState<string[]>(
    initialEntry?.items?.length ? initialEntry.items : ['']
  )
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [exists, setExists] = useState(Boolean(initialEntry))
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const updateItem = (i: number, v: string) => {
    setItems(prev => prev.map((item, idx) => (idx === i ? v : item)))
    setSaved(false)
  }

  const addItem = () => {
    setItems(prev => (prev.length >= MAX_ITEMS ? prev : [...prev, '']))
    setSaved(false)
  }

  const removeItem = (i: number) => {
    if (items.length === 1) return
    setItems(prev => prev.filter((_, idx) => idx !== i))
    setSaved(false)
  }

  const handleSave = () => {
    const filtered = items.map(s => s.trim()).filter(Boolean)
    if (!filtered.length) {
      setError("Add at least one thing you're grateful for.")
      return
    }
    setError('')

    if (isGuest) {
      saveGuest(filtered)
      setSaved(true)
      onSaved?.(filtered)
      return
    }

    startTransition(async () => {
      const result = await saveEntry(date, filtered, Intl.DateTimeFormat().resolvedOptions().timeZone)
      if (result.error) {
        setError(result.error)
      } else {
        setSaved(true)
        setExists(true)
        onSaved?.(filtered)
      }
    })
  }

  const handleDelete = () => {
    setError('')
    startTransition(async () => {
      const result = await deleteEntry(date)
      if (result.error) {
        setError(result.error)
      } else {
        setItems([''])
        setSaved(false)
        setExists(false)
        onSaved?.([])
      }
      setConfirmingDelete(false)
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-tigf-magenta font-bold text-base w-6 text-center shrink-0 select-none">
            {i + 1}.
          </span>
          <input
            type="text"
            value={item}
            onChange={e => updateItem(i, e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addItem()
              }
            }}
            maxLength={MAX_ITEM_LENGTH}
            aria-label={`Grateful item ${i + 1}`}
            placeholder="I'm grateful for…"
            autoFocus={i === items.length - 1 && items.length > 1}
            className="
              flex-1 px-4 py-3 rounded-xl border-2 bg-[var(--surface)] text-[var(--foreground)]
              placeholder:text-[var(--muted)] outline-none transition-colors duration-150
              border-[var(--border)] focus:border-tigf-magenta
            "
          />
          {items.length > 1 && (
            <button
              type="button"
              onClick={() => removeItem(i)}
              aria-label="Remove item"
              className="w-9 h-9 rounded-lg flex items-center justify-center text-xl leading-none
                text-[var(--muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              ×
            </button>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={addItem}
        className="flex items-center gap-2 text-tigf-magenta font-semibold text-sm hover:opacity-75 transition-opacity w-fit"
      >
        <span className="w-6 h-6 rounded-full border-2 border-tigf-magenta inline-flex items-center justify-center text-base leading-none">
          +
        </span>
        Add another
      </button>

      {error && (
        <p className="text-sm text-red-500 font-medium bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl">
          {error}
        </p>
      )}

      <Button onClick={handleSave} loading={isPending} size="lg" className="w-full mt-1">
        {saved ? '✓ Saved!' : isPending ? 'Saving…' : 'Save entry'}
      </Button>

      {!isGuest && exists && (
        confirmingDelete ? (
          <div role="alert" className="flex flex-col items-center gap-2 text-sm">
            <p className="text-[var(--foreground)]">Delete this day’s entry permanently?</p>
            <div className="flex gap-4">
              <button type="button" onClick={handleDelete} disabled={isPending}
                className="font-semibold text-red-600 hover:text-red-700 disabled:opacity-50">
                Yes, delete
              </button>
              <button type="button" onClick={() => setConfirmingDelete(false)} disabled={isPending}
                className="font-semibold text-[var(--muted)] hover:text-[var(--foreground)]">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirmingDelete(true)}
            className="mx-auto text-sm font-semibold text-[var(--muted)] hover:text-red-500 transition-colors">
            Delete this entry
          </button>
        )
      )}

      {saved && isGuest && (
        <p className="text-center text-sm text-[var(--muted)]">
          Saved on this device only.{' '}
          <a href="/signup" className="text-tigf-magenta font-semibold hover:underline">
            Sign up to sync →
          </a>
        </p>
      )}
    </div>
  )
}
