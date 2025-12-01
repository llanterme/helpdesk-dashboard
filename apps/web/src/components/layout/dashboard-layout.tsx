'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { MobileMenu } from './mobile-menu'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useAuth()

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile menu */}
      <MobileMenu open={sidebarOpen} setOpen={setSidebarOpen} />

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <Sidebar />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} user={user} />
        <main className="flex-1 relative overflow-y-auto focus:outline-none bg-white">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}