import type { Metadata } from 'next'
import './globals.css'
import { TopHeader } from '@/components/layout/TopHeader'
import { BottomNav } from '@/components/layout/BottomNav'
import { BottomNavSpacer } from '@/components/layout/BottomNavSpacer'
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: {
    default: "TIGF — Today I'm Grateful For",
    template: '%s · TIGF',
  },
  description: "Write what you're grateful for today and turn it into a shareable image.",
  manifest: '/manifest.json',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Inline script prevents dark-mode flash before React hydrates */}
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var t = localStorage.getItem('tigf-theme');
            if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
              document.documentElement.classList.add('dark');
            }
          } catch(e) {}
        `}} />
        <meta name="theme-color" content="#a62c71" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="TIGF" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="antialiased min-h-screen">
        <ServiceWorkerRegister />
        <TopHeader user={user} />
        <main>
          {children}
          <BottomNavSpacer show={!!user} />
        </main>
        <BottomNav user={user} />
      </body>
    </html>
  )
}