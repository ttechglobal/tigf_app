/**
 * Share a PNG blob via Web Share API, falling back to clipboard copy of the URL.
 */
export async function shareImage(blob: Blob, title: string): Promise<'shared' | 'copied' | 'error'> {
  if (navigator.share && navigator.canShare) {
    const file = new File([blob], 'tigf-gratitude.png', { type: 'image/png' })
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title })
        return 'shared'
      } catch (e) {
        if ((e as Error).name !== 'AbortError') console.error(e)
        return 'error'
      }
    }
  }

  // Fallback: copy page URL
  try {
    await navigator.clipboard.writeText(window.location.href)
    return 'copied'
  } catch {
    return 'error'
  }
}
