import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function useAuth(requireAuth = true) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (requireAuth && status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router, requireAuth])

  return {
    session,
    status,
    user: session?.user,
    isAuthenticated: !!session,
    isLoading: status === 'loading',
  }
}

export function useRole() {
  const { session } = useAuth()

  return {
    isAdmin: session?.user?.role === 'ADMIN',
    isAgent: session?.user?.role === 'AGENT',
    role: session?.user?.role,
    agent: session?.user?.agent,
  }
}