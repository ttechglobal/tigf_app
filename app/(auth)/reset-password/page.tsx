import { getUser } from '@/lib/supabase/user'
import { redirect } from 'next/navigation'
import { ResetPasswordForm } from './ResetPasswordForm'

export const metadata = { title: 'Set a new password' }

export default async function ResetPasswordPage() {
  const user = await getUser()
  if (!user) redirect('/forgot-password?notice=expired')
  return <ResetPasswordForm />
}
