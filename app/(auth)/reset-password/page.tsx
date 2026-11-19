import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ResetPasswordForm } from './ResetPasswordForm'

export const metadata = { title: 'Set a new password' }

export default async function ResetPasswordPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/forgot-password?notice=expired')
  return <ResetPasswordForm />
}
