'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MIN_PASSWORD_LENGTH, USERNAME_PATTERN } from '@/lib/utils/limits'
import { getSiteUrl } from '@/lib/utils/site-url'

export async function signUp(formData: FormData) {
  const supabase = await createClient()

  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const username = String(formData.get('username') ?? '').trim()

  if (!USERNAME_PATTERN.test(username)) {
    return { error: 'Username must be 3–30 characters: letters, numbers and underscores only.' }
  }
  if (!email) return { error: 'Enter your email address.' }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` }
  }

  // Pass username as user_metadata — the on_auth_user_created Postgres
  // trigger reads this and creates the profiles row server-side, with
  // superuser privileges. This works correctly regardless of whether
  // "Confirm email" is enabled (i.e. even before the user has a session).
  const base = await getSiteUrl()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
      emailRedirectTo: base ? `${base}/auth/callback?next=/dashboard` : undefined,
    },
  })

  if (error) {
    if (error.message.toLowerCase().includes('already registered')) {
      return { error: 'An account with this email already exists.' }
    }
    return { error: error.message }
  }

  // If email confirmation is required, there's no session yet —
  // tell the user to check their inbox instead of redirecting.
  if (data.user && !data.session) {
    return { needsConfirmation: true }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function logIn(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    if (error.message.toLowerCase().includes('email not confirmed')) {
      return { error: 'Please confirm your email before signing in. Check your inbox.' }
    }
    if (error.message.toLowerCase().includes('invalid login credentials')) {
      return { error: 'Incorrect email or password.' }
    }
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function logOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
