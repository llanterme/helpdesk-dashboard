'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { TicketList } from '@/components/tickets/TicketList'
import { TicketDetail } from '@/components/tickets/TicketDetail'
import { useTicketStore } from '@/stores/ticketStore'
import { useAuth } from '@/hooks/useAuth'

export default function TicketsPage() {
  useAuth() // Ensure user is authenticated
  const { selectedTicket } = useTicketStore()

  return (
    <DashboardLayout>
      <div className="flex h-full">
        <TicketList />
        <TicketDetail ticket={selectedTicket} />
      </div>
    </DashboardLayout>
  )
}