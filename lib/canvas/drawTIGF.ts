import { formatDateDisplay } from '@/lib/utils/date'

export interface DrawConfig {
  ctx: CanvasRenderingContext2D
  items: string[]
  dayNumber: number
  date: Date | string
  handle?: string
}

// The generated image always uses the one true TIGF brand palette —
// it's a brand artifact, not a theme-aware screenshot, so it doesn't
// change based on whether the app's UI is in light or dark mode.
const BRAND = {
  bg: '#fffef4', headerText: '#1a1a1a', magenta: '#a62c71',
  teal: '#00B8CC', pink: '#E91E8C', card: '#a62c71',
  white: '#FFFFFF', subText: '#888080',
}

// Draw text with manual letter spacing (ctx.letterSpacing has patchy support)
function spacedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number,
  align: 'left' | 'center' | 'right' = 'left'
) {
  // Measure total width first for centering
  const origAlign = ctx.textAlign
  ctx.textAlign = 'left'
  let totalW = 0
  for (let i = 0; i < text.length; i++) {
    totalW += ctx.measureText(text[i]).width + (i < text.length - 1 ? spacing : 0)
  }
  let startX = x
  if (align === 'center') startX = x - totalW / 2
  else if (align === 'right') startX = x - totalW

  let cx = startX
  for (let i = 0; i < text.length; i++) {
    ctx.fillText(text[i], cx, y)
    cx += ctx.measureText(text[i]).width + spacing
  }
  ctx.textAlign = origAlign
}

function drawBlobs(ctx: CanvasRenderingContext2D, c: typeof BRAND, S: number) {
  ctx.save()
  ctx.fillStyle = c.pink
  ctx.globalAlpha = 0.92

  // Bottom-left blob
  ctx.beginPath()
  ctx.moveTo(0, S)
  ctx.bezierCurveTo(0, S - 90, 55, S - 145, 175, S - 85)
  ctx.bezierCurveTo(245, S - 45, 220, S - 4, 275, S)
  ctx.closePath()
  ctx.fill()

  // Bottom-right blob (mirrored)
  ctx.beginPath()
  ctx.moveTo(S, S)
  ctx.bezierCurveTo(S, S - 90, S - 55, S - 145, S - 175, S - 85)
  ctx.bezierCurveTo(S - 245, S - 45, S - 220, S - 4, S - 275, S)
  ctx.closePath()
  ctx.fill()

  ctx.restore()
}

// The logo is a designed PNG asset (Lulu Font TH, exported from Canva) —
// not redrawable accurately with web-safe fonts, so we load and stamp it
// instead of trying to fake hand-lettering with canvas text.
const LOGO_SRC = '/logo-tigf.png'
const LOGO_ASPECT = 929 / 386 // width / height, from the source asset

let cachedLogoImage: HTMLImageElement | null = null
let cachedLogoPromise: Promise<HTMLImageElement> | null = null

function loadLogoImage(): Promise<HTMLImageElement> {
  if (cachedLogoImage) return Promise.resolve(cachedLogoImage)
  if (cachedLogoPromise) return cachedLogoPromise

  cachedLogoPromise = new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      cachedLogoImage = img
      resolve(img)
    }
    img.onerror = reject
    img.src = LOGO_SRC
  })
  return cachedLogoPromise
}

function drawLogo(ctx: CanvasRenderingContext2D, x: number, y: number, targetWidth: number) {
  const img = cachedLogoImage
  if (!img) return // caller must await ensureLogoLoaded() first
  const targetHeight = targetWidth / LOGO_ASPECT
  // x, y is the top-left of the logo's drawn bounding box
  ctx.drawImage(img, x, y, targetWidth, targetHeight)
  return targetHeight
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  font: string,
  maxWidth: number
): string[] {
  ctx.font = font
  const words = text.split(' ')
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w
    if (ctx.measureText(test).width > maxWidth && cur) {
      lines.push(cur); cur = w
    } else { cur = test }
  }
  if (cur) lines.push(cur)
  return lines
}

export function drawTIGF(config: DrawConfig) {
  const { ctx, items, dayNumber, date, handle = 'TIGF · tigf.app' } = config
  const c = BRAND
  const S = 1080
  const PAD = 72

  ctx.clearRect(0, 0, S, S)

  // ── Background ───────────────────────────────────────────
  ctx.fillStyle = c.bg
  ctx.fillRect(0, 0, S, S)

  // ── Bottom blobs (drawn early so card sits on top) ────────
  drawBlobs(ctx, c, S)

  // ── Header: "WHAT ARE YOU GRATEFUL FOR?" ─────────────────
  ctx.save()
  ctx.fillStyle = c.headerText
  ctx.font = `500 34px 'Fredoka', Arial, sans-serif`
  spacedText(ctx, 'WHAT ARE YOU GRATEFUL FOR?', S / 2, 90, 7, 'center')
  ctx.restore()

  // ── TIGF logo (image asset) ──────────────────────────────
  const logoWidth = 290
  const logoY = 195
  const logoHeight = drawLogo(ctx, PAD, logoY, logoWidth) ?? logoWidth / LOGO_ASPECT

  // ── DAY N (top right) ────────────────────────────────────
  ctx.save()
  ctx.fillStyle = c.magenta
  ctx.font = `600 44px 'Fredoka', Arial, sans-serif`
  ctx.textAlign = 'right'
  spacedText(ctx, `DAY ${dayNumber}`, S - PAD, 240, 3, 'right')
  ctx.restore()

  // ── Date under logo ──────────────────────────────────────
  ctx.save()
  ctx.fillStyle = c.magenta
  ctx.font = `500 24px 'Fredoka', Arial, sans-serif`
  spacedText(ctx, formatDateDisplay(date), PAD + 22, logoY + logoHeight + 69, 4, 'left')
  ctx.restore()

  // ── "Today, I'm [N] Grateful For:" row + fused badge/card ─
  const rowY = 500
  const badgeR = 72
  const cardX = 179, cardY = 517
  const cardW = S - cardX * 2
  const cardH = 444
  const cardR = 28

  // Badge sits centered on the card's top edge, fused into one shape
  const badgeCX = S / 2
  const badgeCY = cardY // center of badge sits exactly on the card's top edge

  ctx.save()
  ctx.font = `400 32px 'Fredoka', Arial, sans-serif`

  const leftText = "Today, I'm"
  const rightText = 'Grateful For:'
  const lW = ctx.measureText(leftText).width
  const rW = ctx.measureText(rightText).width
  const gap = 30

  ctx.fillStyle = c.headerText
  ctx.textAlign = 'right'
  ctx.fillText(leftText, badgeCX - badgeR - gap, rowY)

  ctx.textAlign = 'left'
  ctx.fillText(rightText, badgeCX + badgeR + gap, rowY)
  ctx.restore()

  // ── Card + badge: one fused shape, flat top corners ──────
  ctx.save()
  ctx.fillStyle = c.card
  ctx.shadowColor = 'rgba(0,0,0,0.18)'
  ctx.shadowBlur = 32
  ctx.shadowOffsetY = 8

  const topCardR = 33

  ctx.beginPath()
  // Start partway down the left edge (top-left corner will be rounded)
  ctx.moveTo(cardX, cardY + topCardR)
  // Rounded top-left corner
  ctx.quadraticCurveTo(cardX, cardY, cardX + topCardR, cardY)
  // Across the top to where the badge begins
  ctx.lineTo(badgeCX - badgeR, cardY)
  // Up and around the badge semicircle (drawn as the top bump)
  ctx.arc(badgeCX, cardY, badgeR, Math.PI, 0, false)
  // Continue across the top toward the rounded top-right corner
  ctx.lineTo(cardX + cardW - topCardR, cardY)
  // Rounded top-right corner
  ctx.quadraticCurveTo(cardX + cardW, cardY, cardX + cardW, cardY + topCardR)
  // Down the right side to the rounded bottom-right corner
  ctx.lineTo(cardX + cardW, cardY + cardH - cardR)
  ctx.quadraticCurveTo(cardX + cardW, cardY + cardH, cardX + cardW - cardR, cardY + cardH)
  // Across the bottom
  ctx.lineTo(cardX + cardR, cardY + cardH)
  // Rounded bottom-left corner
  ctx.quadraticCurveTo(cardX, cardY + cardH, cardX, cardY + cardH - cardR)
  // Up the left side back to start
  ctx.lineTo(cardX, cardY + topCardR)
  ctx.closePath()
  ctx.fill()
  ctx.shadowColor = 'transparent'
  ctx.restore()

  // Badge number, drawn after the fused shape so it sits on top
  ctx.save()
  ctx.fillStyle = c.white
  ctx.font = `600 48px 'Fredoka', Arial, sans-serif`
  ctx.textAlign = 'center'
  const badgeVisibleMidY = (cardY - badgeR + cardY) / 2
  ctx.fillText(String(dayNumber), badgeCX, badgeVisibleMidY + 20)
  ctx.restore()

  // ── Items inside card ────────────────────────────────────
  const cardInnerPad = 70
  const maxLineW = cardW - cardInnerPad * 2
  const availableTextH = cardH - 48 // small top/bottom breathing room inside the card

  type Line = { text: string; isNumber: boolean; blank?: boolean }

  // Build the wrapped line list for a given font size, returning both the
  // lines and the total height they'd take up — so we can test-fit before committing.
  function layoutAtSize(fontSize: number): { lines: Line[]; totalH: number; numberColW: number } {
    const font = `400 ${fontSize}px 'Open Sans', Arial, sans-serif`
    const numberFont = `600 ${fontSize}px 'Open Sans', Arial, sans-serif`
    const lineH = fontSize * 1.5

    ctx.font = numberFont
    const numberColW = Math.max(...items.map((_, i) => ctx.measureText(`${i + 1}.`).width)) + 14

    const lines: Line[] = []
    items.forEach((item, idx) => {
      const wrapped = wrapText(ctx, item, font, maxLineW - numberColW)
      wrapped.forEach((l, li) => lines.push({ text: l, isNumber: li === 0 }))
      if (idx < items.length - 1) lines.push({ text: '', isNumber: false, blank: true })
    })

    const totalH = lines.filter(l => !l.blank).length * lineH +
      lines.filter(l => l.blank).length * (lineH * 0.5)

    return { lines, totalH, numberColW }
  }

  // Start from a size appropriate to the item count, then shrink in small
  // steps until the wrapped content actually fits the card. This replaces
  // fixed tiers — which broke down past ~7 items — with a measurement that
  // always fits, regardless of how many items or how long they are.
  const MIN_FONT_SIZE = 18
  let fontSize = items.length === 1 ? 44 : items.length <= 3 ? 36 : items.length <= 6 ? 30 : 26
  let layout = layoutAtSize(fontSize)

  while (layout.totalH > availableTextH && fontSize > MIN_FONT_SIZE) {
    fontSize -= 2
    layout = layoutAtSize(fontSize)
  }

  const { lines: allLines, totalH: totalTextH, numberColW } = layout
  const lineH = fontSize * 1.5
  const itemFont = `400 ${fontSize}px 'Open Sans', Arial, sans-serif`
  const numberFont = `600 ${fontSize}px 'Open Sans', Arial, sans-serif`

  ctx.save()
  ctx.fillStyle = c.white
  ctx.textAlign = 'left'

  // If even the minimum font size doesn't fit, clip to the card's actual
  // shape (matching its real top/bottom corner radii) rather than spilling
  // text outside the card.
  if (totalTextH > availableTextH) {
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(cardX, cardY + topCardR)
    ctx.quadraticCurveTo(cardX, cardY, cardX + topCardR, cardY)
    ctx.lineTo(cardX + cardW - topCardR, cardY)
    ctx.quadraticCurveTo(cardX + cardW, cardY, cardX + cardW, cardY + topCardR)
    ctx.lineTo(cardX + cardW, cardY + cardH - cardR)
    ctx.quadraticCurveTo(cardX + cardW, cardY + cardH, cardX + cardW - cardR, cardY + cardH)
    ctx.lineTo(cardX + cardR, cardY + cardH)
    ctx.quadraticCurveTo(cardX, cardY + cardH, cardX, cardY + cardH - cardR)
    ctx.closePath()
    ctx.clip()
  }

  let ty = cardY + Math.max((cardH - totalTextH) / 2, 24) + fontSize * 0.85
  const textX = cardX + cardInnerPad
  let itemIdx = 0

  for (const line of allLines) {
    if (line.blank) { ty += lineH * 0.5; continue }

    if (line.isNumber) {
      ctx.font = numberFont
      ctx.fillText(`${itemIdx + 1}.`, textX, ty)
      itemIdx++
    }

    ctx.font = itemFont
    ctx.fillText(line.text, textX + numberColW, ty)
    ty += lineH
  }

  if (totalTextH > availableTextH) ctx.restore()
  ctx.restore()

  // ── Bottom handle ────────────────────────────────────────
  ctx.save()
  ctx.fillStyle = c.subText
  ctx.font = `400 21px 'Fredoka', Arial, sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText(handle, S / 2, S - 30)
  ctx.restore()
}

export async function ensureFontsLoaded(): Promise<void> {
  if (typeof document === 'undefined') return
  try {
    await Promise.all([
      document.fonts.load("400 16px 'Open Sans'"),
      document.fonts.load("600 16px 'Open Sans'"),
      document.fonts.load("700 16px 'Open Sans'"),
      document.fonts.load("400 16px 'Fredoka'"),
      document.fonts.load("500 16px 'Fredoka'"),
      document.fonts.load("600 16px 'Fredoka'"),
      loadLogoImage(),
    ])
  } catch { /* fall back to Arial; logo will simply not draw if it fails */ }
}