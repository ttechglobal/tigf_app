'use client'

import { useState, useEffect } from 'react'

// All KJV (King James Version) — public domain, quoted in full and verbatim.
const VERSES = [
  {
    text: 'In every thing give thanks: for this is the will of God in Christ Jesus concerning you.',
    ref: '1 Thessalonians 5:18',
  },
  {
    text: 'Enter into his gates with thanksgiving, and into his courts with praise: be thankful unto him, and bless his name.',
    ref: 'Psalm 100:4',
  },
  {
    text: 'And whatsoever ye do in word or deed, do all in the name of the Lord Jesus, giving thanks to God and the Father by him.',
    ref: 'Colossians 3:17',
  },
  {
    text: 'And the LORD answered me, and said, Write the vision, and make it plain upon tables, that he may run that readeth it.',
    ref: 'Habakkuk 2:2',
  },
  {
    text: 'O give thanks unto the LORD, for he is good: for his mercy endureth for ever.',
    ref: 'Psalm 107:1',
  },
]

const ROTATE_MS = 10000 // slow rotation — one verse every 10 seconds

export function GratitudeVerse() {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      // wait for the fade-out, then swap text and fade back in
      setTimeout(() => {
        setIndex(i => (i + 1) % VERSES.length)
        setVisible(true)
      }, 400)
    }, ROTATE_MS)

    return () => clearInterval(interval)
  }, [])

  const verse = VERSES[index]

  return (
    <div className="text-center px-2">
      <p
        className={`text-sm italic text-[var(--muted)] leading-relaxed transition-opacity duration-400 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        "{verse.text}"
      </p>
      <p
        className={`text-xs font-semibold text-tigf-magenta mt-1 transition-opacity duration-400 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {verse.ref}
      </p>
    </div>
  )
}