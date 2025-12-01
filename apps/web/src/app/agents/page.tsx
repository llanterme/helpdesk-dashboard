'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { AgentList } from '@/components/agents/AgentList'
import { useAuth } from '@/hooks/useAuth'

export default function AgentsPage() {
  useAuth() // Ensure user is authenticated

  return (
    <DashboardLayout>
      <AgentList />
    </DashboardLayout>
  )
}