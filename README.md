# TIGF — Today I'm Grateful For

The simplest possible gratitude app. Write what you're grateful for today,
save it, and generate an image to download. That's it.

**Stack:** Next.js 16 (App Router) · Supabase (auth + Postgres) · Tailwind CSS v4 · HTML Canvas · installable PWA

---

## What it does

1. Sign up / log in (email + password via Supabase)
2. Write 1+ things you're grateful for today → Save
3. See your day count ("Day 7") — counts from your first ever entry
4. Generate a 1080×1080 image of today's entry → Download
5. Look back at past entries in **My Journal** (read-only list)
6. Install it on your phone/desktop as an app (PWA)

Nothing else. No community feed, no profile/stats page, no entry editing
after the fact — just write, save, generate, look back.

---

## Quick start

### 1. Install

```bash
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Open **SQL Editor** → paste all of `supabase-schema.sql` → Run

> The schema includes a Postgres trigger that auto-creates a `profiles` row
> the instant someone signs up. This works correctly whether or not
> "Confirm email" is turned on in Supabase Auth settings — don't skip it.

### 3. Environment variables

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

Both values are in **Supabase → Settings → API**.

### 4. Run it

```bash
npm run dev
# → http://localhost:3000
```

---

## Project structure

```
app/
  page.tsx                    Landing page — guests can write an entry without an account
  (auth)/login, /signup       Email + password forms
  (app)/dashboard             Today's entry + image generation  ← the main screen
  (app)/journal               Read-only list of all past entries

components/
  dashboard/EntryForm.tsx       The gratitude input form (used by guests and logged-in users)
  dashboard/GuestDashboard.tsx  Wraps EntryForm + canvas for the landing page
  canvas/CanvasRenderer.tsx     Generate / Download / Share buttons + image preview
  journal/EntryCard.tsx         One row in the journal list
  layout/Navbar.tsx             Top bar + mobile bottom tabs + dark mode toggle
  ui/Button.tsx, Input.tsx      Basic reusable bits

lib/
  canvas/drawTIGF.ts        Pure function that draws the 1080×1080 image on a <canvas>
  actions/auth.ts           signUp, logIn, logOut (Server Actions)
  actions/entries.ts        saveEntry (Server Action)
  queries/entries.ts        getAllEntries, getTodayEntry
  supabase/client.ts        Browser Supabase client
  supabase/server.ts        Server Supabase client
  utils/date.ts             Date formatting helpers
  utils/share.ts            Web Share API with clipboard fallback

hooks/
  useTheme.ts        Dark mode toggle (localStorage)
  useGuestEntry.ts   Saves a guest's entry in localStorage (no account needed)

public/
  manifest.json   PWA manifest
  sw.js           Minimal service worker (makes the app installable)
  icon-*.png      App icons
```

---

## Database

Two tables:

| Table | Columns |
|---|---|
| `profiles` | `id` (matches the Supabase auth user), `username` |
| `entries` | `user_id`, `date`, `items` (a list of strings), timestamps |

- One entry per user per day — saving again the same day overwrites it
- "Day N" is never stored. It's just "how many entries does this user have, sorted by date, what position is today's?" — computed fresh every time, so it can never be wrong or go stale.

---

## How the image is generated

`lib/canvas/drawTIGF.ts` is a plain function — no React, no Supabase — that
takes a `<canvas>` 2D context and draws the TIGF template onto it:
background, header text, logo, day badge, the gratitude card, and your
items. `CanvasRenderer.tsx` calls it, then offers Download (saves a PNG)
and Share (uses the device's native share sheet, or copies a link if that's
not available).

---

## PWA — installing on a phone

Once deployed (needs HTTPS — Vercel gives you this automatically):

- **iPhone (Safari):** Share button → "Add to Home Screen"
- **Android (Chrome):** Menu → "Install app" (or a banner will offer this automatically)
- **Desktop (Chrome/Edge):** An install icon appears in the address bar

The app then opens full-screen, with its own icon, like a native app.

---

## Deploying

```bash
npm i -g vercel
vercel
```

Add your two Supabase env vars when prompted, or via the Vercel dashboard
under **Settings → Environment Variables**.
