import { getUser } from '@/lib/supabase/user'
import { redirect } from 'next/navigation'
import { SignUpForm } from './SignUpForm'

export const metadata = { title: 'Create account' }

export default async function SignUpPage() {
  const user = await getUser()
  if (user) redirect('/dashboard')
  return <SignUpForm />
}
