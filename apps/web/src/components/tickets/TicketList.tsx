'use client'

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTicketStore, TicketWithRelations } from '@/stores/ticketStore'
import { TicketItem } from './TicketItem'
import { TicketFilters } from './TicketFilters'

export function TicketList() {
  const {
    tickets,
    selectedTicket,
    filters,
    setTickets,
    setSelectedTicket,
    getFilteredTickets
  } = useTicketStore()

  const { data, isLoading, error } = useQuery({
    queryKey: ['tickets', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.channel !== 'all') params.set('channel', filters.channel)
      if (filters.status !== 'all') params.set('status', filters.status)

      const response = await fetch(`/api/tickets?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch tickets')
      }
      return response.json() as Promise<TicketWithRelations[]>
    },
    staleTime: 30000, // 30 seconds
  })

  useEffect(() => {
    if (data) {
      setTickets(data)
    }
  }, [data, setTickets])

  const filteredTickets = getFilteredTickets()

  if (isLoading) {
    return (
      <div className="w-96 bg-white border-r border-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading tickets...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-96 bg-white border-r border-gray-200 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>Error loading tickets</p>
          <p className="text-sm text-gray-500 mt-1">
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-96 bg-white border-r border-gray-200 flex flex-col h-full">
      <TicketFilters />

      <div className="flex-1 overflow-y-auto">
        {filteredTickets.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No tickets found</p>
            {filters.search && (
              <p className="text-xs mt-1">Try adjusting your search or filters</p>
            )}
          </div>
        ) : (
          filteredTickets.map((ticket) => (
            <TicketItem
              key={ticket.id}
              ticket={ticket}
              isSelected={selectedTicket?.id === ticket.id}
              onClick={() => setSelectedTicket(ticket)}
            />
          ))
        )}
      </div>
    </div>
  )
}