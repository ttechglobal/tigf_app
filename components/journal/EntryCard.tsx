import { formatDateLong } from '@/lib/utils/date'
import type { Entry } from '@/types'

export function EntryCard({ entry }: { entry: Entry }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-tigf-magenta uppercase tracking-wider">
          Day {entry.day_number}
        </span>
        <span className="text-xs text-[var(--muted)]">{formatDateLong(entry.date)}</span>
      </div>

      <ul className="flex flex-col gap-1.5">
        {entry.items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-[var(--foreground)]">
            <span className="text-tigf-pink mt-0.5 shrink-0 select-none">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
