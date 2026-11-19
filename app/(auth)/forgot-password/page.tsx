import { getUser } from '@/lib/supabase/user'
import { redirect } from 'next/navigation'
import { ForgotPasswordForm } from './ForgotPasswordForm'

export const metadata = { title: 'Reset password' }

export default async function ForgotPasswordPage({ searchParams }: {
  searchParams: Promise<{ notice?: string }>
}) {
  const user = await getUser()
  if (user) redirect('/reset-password')
  const { notice } = await searchParams
  return <ForgotPasswordForm expired={notice === 'expired'} />
}
