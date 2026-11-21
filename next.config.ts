import type { NextConfig } from "next";

const ONE_WEEK = 'public, max-age=604800, stale-while-revalidate=86400'

const nextConfig: NextConfig = {
  experimental: {
    // Client router cache: tab switches (Today / Journal / Shop / Settings) reuse
    // the page for a while instead of hitting the server every time. Saving or
    // deleting an entry calls revalidatePath, which clears this cache, so data
    // never goes stale after a change.
    staleTimes: { dynamic: 120, static: 600 },
  },
  async headers() {
    return [
      // Always revalidate the service worker so installed apps (iPhone PWA) see updates.
      { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }] },
      // Fingerprinted/static assets: cache hard in the browser and on the CDN.
      { source: '/shop/:path*', headers: [{ key: 'Cache-Control', value: ONE_WEEK }] },
      { source: '/:file(logo-tigf.png|icon-192.png|icon-512.png|apple-touch-icon.png)', headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' }] },
    ]
  },
};

export default nextConfig;
