'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ClientList } from '@/components/clients/ClientList'
import { useAuth } from '@/hooks/useAuth'

export default function ClientsPage() {
  useAuth() // Ensure user is authenticated

  return (
    <DashboardLayout>
      <ClientList />
    </DashboardLayout>
  )
}