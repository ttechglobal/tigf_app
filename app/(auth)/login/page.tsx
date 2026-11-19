import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LoginForm } from './LoginForm'

export const metadata = { title: 'Sign in' }

export default async function LoginPage({ searchParams }: {
  searchParams: Promise<{ notice?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')
  const { notice } = await searchParams
  return <LoginForm linkProblem={notice === 'link'} />
}
