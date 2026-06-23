export const metadata = { title: 'MyMusings' }

const STORE_URL = 'https://mymusings.bumpa.shop/'

const PRODUCTS = [
  { name: 'One Day at a Time (Daily Planner)', image: '/shop/one-day-at-a-time.png' },
  { name: 'My Musings Journal', image: '/shop/my-musings-journal.png' },
  { name: 'Crystal Journal (Customised)', image: '/shop/crystal-journal-customised.png' },
  { name: 'Olive Journal', image: '/shop/olive-journal.png' },
  { name: 'Zoe The Life of God', image: '/shop/zoe-life-of-god.png' },
  { name: 'Olive Journal (Customised)', image: '/shop/olive-journal-customised.png' },
  { name: 'Crystal Journal (Plain)', image: '/shop/crystal-journal-plain.png' },
  { name: 'My Daily Drops of Gratitude — 30 days', image: '/shop/daily-drops-30-days.png' },
  { name: 'Crystal Journal', image: '/shop/crystal-journal.png' },
  { name: 'Olive Journal (Plain)', image: '/shop/olive-journal-plain.png' },
  { name: 'My Daily Drops of Gratitude — 60 days', image: '/shop/daily-drops-60-days.png' },
]

export default function ShopPage() {
  return (
    <div className="max-w-2xl mx-auto w-full px-4 pt-3 pb-6 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black text-[var(--foreground)]">MyMusings</h1>
        <p className="text-[var(--muted)] text-sm mt-1">
          Physical gratitude journals — tap Get to shop on the MyMusings store.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {PRODUCTS.map((product) => (
          <div
            key={product.name}
            className="flex flex-col gap-2 bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden"
          >
            <div className="aspect-square w-full overflow-hidden bg-[var(--background)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="px-3 pb-3 flex flex-col gap-2">
              <p className="text-sm font-semibold text-[var(--foreground)] leading-snug line-clamp-2">
                {product.name}
              </p>
              <a
                href={STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-center text-sm font-bold text-white bg-tigf-magenta hover:bg-tigf-magenta-dark transition-colors rounded-xl py-2"
              >
                Get
              </a>
            </div>
          </div>
        ))}
      </div>

      <a
        href={STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-center text-sm font-semibold text-tigf-magenta hover:underline py-2"
      >
        View full store on Bumpa →
      </a>
    </div>
  )
}