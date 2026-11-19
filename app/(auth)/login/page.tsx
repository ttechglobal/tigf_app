import { getUser } from '@/lib/supabase/user'
import { redirect } from 'next/navigation'
import { LoginForm } from './LoginForm'

export const metadata = { title: 'Sign in' }

export default async function LoginPage({ searchParams }: {
  searchParams: Promise<{ notice?: string }>
}) {
  const user = await getUser()
  if (user) redirect('/dashboard')
  const { notice } = await searchParams
  return <LoginForm linkProblem={notice === 'link'} />
}
