import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: 'ADMIN' | 'AGENT'
      agent?: {
        id: string
        name: string
        email: string
        phone?: string | null
        role: 'ADMIN' | 'SENIOR_AGENT' | 'AGENT'
        avatar?: string | null
        color?: string | null
        commissionRate: number
        status: 'ACTIVE' | 'INACTIVE'
      } | null
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    role: 'ADMIN' | 'AGENT'
    agent?: {
      id: string
      name: string
      email: string
      phone?: string | null
      role: 'ADMIN' | 'SENIOR_AGENT' | 'AGENT'
      avatar?: string | null
      color?: string | null
      commissionRate: number
      status: 'ACTIVE' | 'INACTIVE'
    } | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: 'ADMIN' | 'AGENT'
    agent?: {
      id: string
      name: string
      email: string
      phone?: string | null
      role: 'ADMIN' | 'SENIOR_AGENT' | 'AGENT'
      avatar?: string | null
      color?: string | null
      commissionRate: number
      status: 'ACTIVE' | 'INACTIVE'
    } | null
  }
}