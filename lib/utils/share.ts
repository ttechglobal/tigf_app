/**
 * Share a PNG blob via the Web Share API, including a link back to the
 * app so whoever receives the shared image can click through and create
 * their own entry. Falls back to copying "caption + link" to the
 * clipboard when the Web Share API (or file sharing) isn't available.
 *
 * Note on platform behavior: when both `files` and `text`/`url` are passed
 * to navigator.share(), some share targets (notably some Android apps and
 * older WhatsApp/Instagram share-sheet integrations) only honor the file
 * and silently drop the text. This is a known, inconsistent platform
 * limitation — not something a website can force around. Passing the
 * link in `text` (rather than relying on `url` alone) gives it the best
 * realistic chance of surviving across the widest range of share targets.
 */
export async function shareImage(
  blob: Blob,
  title: string,
  shareUrl: string
): Promise<'shared' | 'copied' | 'error'> {
  const caption = `${title}\n\n${shareUrl}`

  if (navigator.share && navigator.canShare) {
    const file = new File([blob], 'tigf-gratitude.png', { type: 'image/png' })
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title,
          text: caption,
        })
        return 'shared'
      } catch (e) {
        if ((e as Error).name !== 'AbortError') console.error(e)
        return 'error'
      }
    }
  }

  // Fallback: copy caption + link to the clipboard
  try {
    await navigator.clipboard.writeText(caption)
    return 'copied'
  } catch {
    return 'error'
  }
}