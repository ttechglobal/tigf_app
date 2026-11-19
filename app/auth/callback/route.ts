import { NextResponse, type NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

/** Only allow same-site relative redirects. */
function safeNext(value: string | null): string {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/dashboard'
}

/**
 * Landing point for links in Supabase emails (confirm signup, reset password).
 * Supports both the PKCE `code` flow and the `token_hash` flow.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const next = safeNext(searchParams.get('next'))
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null

  const supabase = await createClient()
  let ok = false
  if (code) {
    ok = !(await supabase.auth.exchangeCodeForSession(code)).error
  } else if (tokenHash && type) {
    ok = !(await supabase.auth.verifyOtp({ type, token_hash: tokenHash })).error
  }

  return NextResponse.redirect(new URL(ok ? next : '/login?notice=link', origin))
}
