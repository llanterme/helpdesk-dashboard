# Task 03: Authentication System

## Overview
Implement NextAuth.js with email/password authentication, role-based access control, and session management.

## Prerequisites
- Task 01 completed (project setup)
- Task 02 completed (database schema)
- MySQL database with User table available

## Technical Requirements

### Authentication Flow
- Email/password login with secure password hashing
- JWT-based session management
- Role-based access (ADMIN, AGENT)
- Automatic redirects for protected routes
- Logout functionality

### NextAuth.js Configuration

**Auth Configuration (`apps/web/src/lib/auth.ts`)**
```typescript
import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@helpdesk/database'

const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { agent: true }
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          agent: user.agent
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.agent = user.agent
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub
        session.user.role = token.role
        session.user.agent = token.agent
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export default NextAuth(authOptions)
```

**API Route (`apps/web/src/app/api/auth/[...nextauth]/route.ts`)**
```typescript
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
```

### Authentication UI

**Sign In Page (`apps/web/src/app/auth/signin/page.tsx`)**
```typescript
'use client'

import { signIn, getSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Redirect if already authenticated
    getSession().then((session) => {
      if (session) {
        router.push('/')
      }
    })
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
      } else {
        router.push('/')
      }
    } catch (error) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-slate-800 rounded-lg flex items-center justify-center">
            <span className="text-amber-500 font-bold text-lg">HD</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to HelpDesk
          </h2>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-slate-800 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

### Authentication Middleware

**Route Protection (`apps/web/src/middleware.ts`)**
```typescript
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    // Additional authorization logic can go here
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Public routes
        if (pathname.startsWith('/auth/')) {
          return true
        }

        // Protected routes require authentication
        return !!token
      },
    },
  }
)

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
}
```

### Session Provider Setup

**Root Layout with Providers (`apps/web/src/app/layout.tsx`)**
```typescript
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'HelpDesk System',
  description: 'Multi-channel customer support platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

**Providers Component (`apps/web/src/components/providers.tsx`)**
```typescript
'use client'

import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
      },
    },
  }))

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </SessionProvider>
  )
}
```

### Authentication Hooks

**Custom Auth Hook (`apps/web/src/hooks/useAuth.ts`)**
```typescript
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
```

## Implementation Steps

1. **Install Dependencies**
   ```bash
   cd apps/web
   npm install next-auth bcryptjs
   npm install -D @types/bcryptjs
   ```

2. **Setup Environment Variables**
   ```bash
   # Add to .env.local
   NEXTAUTH_SECRET="your-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"
   ```

3. **Create Auth Configuration**
   - Setup NextAuth options with Credentials provider
   - Configure JWT callbacks for role management
   - Setup custom sign-in page

4. **Implement Route Protection**
   - Create middleware for protected routes
   - Setup session providers
   - Create authentication hooks

5. **Create Sign-In UI**
   - Design sign-in form component
   - Handle form submission and errors
   - Add loading states and validation

## Acceptance Criteria

### ✅ Authentication Flow
- [ ] Users can log in with email/password
- [ ] Invalid credentials show appropriate error
- [ ] Successful login redirects to dashboard
- [ ] Sessions persist across browser refreshes

### ✅ Route Protection
- [ ] Unauthenticated users redirected to login
- [ ] Authenticated users can access protected routes
- [ ] Middleware properly protects all routes except public ones

### ✅ Session Management
- [ ] JWT tokens include user role and agent data
- [ ] Sessions expire after configured time
- [ ] Logout functionality works correctly

### ✅ UI Components
- [ ] Sign-in form renders correctly
- [ ] Form validation works properly
- [ ] Loading states display during authentication
- [ ] Error messages show for failed attempts

## Testing Instructions

1. **Test Database Connection**
   ```bash
   # Verify seed data includes admin user
   npx prisma studio
   # Check users table has admin@helpdesk.com
   ```

2. **Test Authentication Flow**
   - Navigate to `http://localhost:3000`
   - Should redirect to `/auth/signin`
   - Try invalid credentials (should show error)
   - Use `admin@helpdesk.com` / `admin123` (should succeed)

3. **Test Route Protection**
   - Access `/` without login (should redirect)
   - Login and access `/` (should work)
   - Logout and verify redirect to login

4. **Test Session Persistence**
   - Login successfully
   - Refresh the page (should stay logged in)
   - Check browser dev tools for session cookie

## Architecture Patterns Established

- **Session Management**: JWT-based with NextAuth.js
- **Route Protection**: Middleware-based authentication
- **Role-Based Access**: User roles in JWT payload
- **Security**: Bcrypt password hashing, secure sessions
- **UI Patterns**: Form validation, loading states, error handling

## Files Created
```
apps/web/src/
├── lib/
│   └── auth.ts
├── app/
│   ├── api/auth/[...nextauth]/
│   │   └── route.ts
│   ├── auth/
│   │   └── signin/
│   │       └── page.tsx
│   └── layout.tsx
├── components/
│   └── providers.tsx
├── hooks/
│   └── useAuth.ts
└── middleware.ts
```

---
**Next Task**: `04-core-layout.md` - Build main application layout with sidebar navigation