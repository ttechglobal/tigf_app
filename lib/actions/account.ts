'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MIN_PASSWORD_LENGTH, USERNAME_PATTERN } from '@/lib/utils/limits'
import { getSiteUrl } from '@/lib/utils/site-url'

/** Always reports success so the form can't be used to discover which emails have accounts. */
export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim()
  if (!email) return { error: 'Enter your email address.' }
  const supabase = await createClient()
  const base = await getSiteUrl()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: base ? `${base}/auth/callback?next=/reset-password` : undefined,
  })
  if (error?.status === 429) return { error: 'Too many requests. Please wait a few minutes and try again.' }
  return { sent: true }
}

export async function updatePassword(formData: FormData) {
  const password = String(formData.get('password') ?? '')
  const confirm = String(formData.get('confirm') ?? '')
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` }
  }
  if (password !== confirm) return { error: 'The two passwords do not match.' }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Your link has expired. Request a new one to continue.' }
  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: error.message || 'Could not update your password. Please try again.' }
  return { success: true }
}

export async function updateUsername(formData: FormData) {
  const username = String(formData.get('username') ?? '').trim()
  if (!USERNAME_PATTERN.test(username)) {
    return { error: 'Username must be 3–30 characters: letters, numbers and underscores only.' }
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Please sign in again.' }
  const { data, error } = await supabase
    .from('profiles').update({ username }).eq('id', user.id).select('username').maybeSingle()
  if (error?.code === '23505') return { error: 'That username is already taken.' }
  if (error || !data) return { error: 'Could not update your username. Please try again.' }
  revalidatePath('/settings')
  return { success: true, username: data.username as string }
}

/** Permanently deletes the account and, by cascade, every entry and reminder. */
export async function deleteAccount(confirmation: string) {
  if (confirmation !== 'DELETE') return { error: 'Type DELETE to confirm.' }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Please sign in again.' }
  const { error } = await supabase.rpc('delete_my_account')
  if (error) {
    console.error('deleteAccount failed', error)
    return { error: 'Could not delete your account. Please try again.' }
  }
  await supabase.auth.signOut({ scope: 'local' })
  revalidatePath('/', 'layout')
  redirect('/')
}
