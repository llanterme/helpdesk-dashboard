import { create } from 'zustand'
import { Ticket, Agent, Client, Message, TicketStatus, TicketChannel, TicketPriority } from '@helpdesk/database'

export interface TicketWithRelations extends Ticket {
  client: Client
  agent?: Agent
  messages: Message[]
}

interface TicketFilters {
  channel: TicketChannel | 'all'
  status: TicketStatus | 'all'
  search: string
}

interface TicketStore {
  // State
  tickets: TicketWithRelations[]
  selectedTicket: TicketWithRelations | null
  filters: TicketFilters
  loading: boolean
  error: string | null

  // Actions
  setTickets: (tickets: TicketWithRelations[]) => void
  setSelectedTicket: (ticket: TicketWithRelations | null) => void
  updateTicket: (id: string, updates: Partial<Ticket>) => void
  setFilters: (filters: Partial<TicketFilters>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // Computed
  getFilteredTickets: () => TicketWithRelations[]
  getTicketCounts: () => Record<string, number>
}

export const useTicketStore = create<TicketStore>((set, get) => ({
  // Initial state
  tickets: [],
  selectedTicket: null,
  filters: {
    channel: 'all',
    status: 'all',
    search: ''
  },
  loading: false,
  error: null,

  // Actions
  setTickets: (tickets) => set({ tickets }),

  setSelectedTicket: (ticket) => set({ selectedTicket: ticket }),

  updateTicket: (id, updates) => set((state) => ({
    tickets: state.tickets.map(ticket =>
      ticket.id === id ? { ...ticket, ...updates } : ticket
    ),
    selectedTicket: state.selectedTicket?.id === id
      ? { ...state.selectedTicket, ...updates }
      : state.selectedTicket
  })),

  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters }
  })),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  // Computed values
  getFilteredTickets: () => {
    const { tickets, filters } = get()
    return tickets.filter(ticket => {
      if (filters.channel !== 'all' && ticket.channel !== filters.channel) {
        return false
      }
      if (filters.status !== 'all' && ticket.status !== filters.status) {
        return false
      }
      if (filters.search && !ticket.subject.toLowerCase().includes(filters.search.toLowerCase())) {
        return false
      }
      return true
    })
  },

  getTicketCounts: () => {
    const { tickets } = get()
    return {
      all: tickets.filter(t => t.status === 'OPEN').length,
      whatsapp: tickets.filter(t => t.channel === 'WHATSAPP' && t.status === 'OPEN').length,
      email: tickets.filter(t => t.channel === 'EMAIL' && t.status === 'OPEN').length,
      form: tickets.filter(t => t.channel === 'FORM' && t.status === 'OPEN').length,
      chat: tickets.filter(t => t.channel === 'CHAT' && t.status === 'OPEN').length,
    }
  }
}))