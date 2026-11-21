import { Skeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div role="status" aria-label="Loading" className="max-w-2xl mx-auto w-full px-4 pt-10 pb-12 flex flex-col gap-8">
      <div className="flex flex-col items-center gap-3">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-72 max-w-full" />
      </div>
      <Skeleton className="h-12 w-full" />
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 flex flex-col gap-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    </div>
  )
}
