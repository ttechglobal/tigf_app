'use client'

/**
 * Creates clearance at the bottom of the page so content doesn't sit
 * underneath the fixed BottomNav. Must be rendered as the LAST element
 * inside <main>, after {children} — not before it — since a `fixed`
 * element takes no layout space wherever else it's placed in the DOM.
 */
export function BottomNavSpacer({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <div
      aria-hidden
      style={{ height: 'calc(76px + env(safe-area-inset-bottom, 0px))' }}
    />
  )
}