'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signUp(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const username = (formData.get('username') as string)?.trim()

  if (!username || username.length < 3) {
    return { error: 'Username must be at least 3 characters.' }
  }

  // Pass username as user_metadata — the on_auth_user_created Postgres
  // trigger reads this and creates the profiles row server-side, with
  // superuser privileges. This works correctly regardless of whether
  // "Confirm email" is enabled (i.e. even before the user has a session).
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
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
