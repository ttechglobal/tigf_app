import { headers } from 'next/headers'

/** Public base URL for links in emails. Prefer NEXT_PUBLIC_SITE_URL; fall back to the request origin. */
export async function getSiteUrl(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, '')
  if (configured) return configured
  return (await headers()).get('origin') ?? ''
}
