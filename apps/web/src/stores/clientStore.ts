import { create } from 'zustand'
import { Client, Ticket, Quote, Invoice } from '@helpdesk/database'

export interface ClientWithStats extends Client {
  activeTickets: number
  totalTickets: number
  totalQuotes: number
  totalInvoices: number
  tickets?: (Ticket & { agent?: any })[]
  quotes?: (Quote & { agent?: any })[]
  invoices?: (Invoice & { agent?: any })[]
  recentActivity?: ActivityItem[]
}

export interface ActivityItem {
  type: 'ticket' | 'quote' | 'invoice'
  id: string
  title: string
  status: string
  date: string | Date
  agent?: string
}

interface ClientFilters {
  search: string
  company: string
}

interface ClientPagination {
  page: number
  limit: number
  total: number
  pages: number
}

interface ClientStore {
  // State
  clients: ClientWithStats[]
  selectedClient: ClientWithStats | null
  filters: ClientFilters
  pagination: ClientPagination
  loading: boolean
  error: string | null

  // Actions
  setClients: (clients: ClientWithStats[], pagination: ClientPagination) => void
  setSelectedClient: (client: ClientWithStats | null) => void
  addClient: (client: ClientWithStats) => void
  updateClient: (id: string, updates: Partial<ClientWithStats>) => void
  removeClient: (id: string) => void
  setFilters: (filters: Partial<ClientFilters>) => void
  setPagination: (pagination: Partial<ClientPagination>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  resetFilters: () => void

  // Computed
  getFilteredClients: () => ClientWithStats[]
  getClientStats: () => {
    total: number
    activeTickets: number
    companies: number
  }
}

const initialFilters: ClientFilters = {
  search: '',
  company: ''
}

const initialPagination: ClientPagination = {
  page: 1,
  limit: 10,
  total: 0,
  pages: 0
}

export const useClientStore = create<ClientStore>((set, get) => ({
  // Initial state
  clients: [],
  selectedClient: null,
  filters: initialFilters,
  pagination: initialPagination,
  loading: false,
  error: null,

  // Actions
  setClients: (clients, pagination) => set({
    clients,
    pagination: { ...get().pagination, ...pagination }
  }),

  setSelectedClient: (client) => set({ selectedClient: client }),

  addClient: (client) => set((state) => ({
    clients: [client, ...state.clients],
    pagination: {
      ...state.pagination,
      total: state.pagination.total + 1
    }
  })),

  updateClient: (id, updates) => set((state) => ({
    clients: state.clients.map(client =>
      client.id === id ? { ...client, ...updates } : client
    ),
    selectedClient: state.selectedClient?.id === id
      ? { ...state.selectedClient, ...updates }
      : state.selectedClient
  })),

  removeClient: (id) => set((state) => ({
    clients: state.clients.filter(client => client.id !== id),
    selectedClient: state.selectedClient?.id === id ? null : state.selectedClient,
    pagination: {
      ...state.pagination,
      total: Math.max(0, state.pagination.total - 1)
    }
  })),

  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters },
    pagination: { ...state.pagination, page: 1 } // Reset to first page when filtering
  })),

  setPagination: (pagination) => set((state) => ({
    pagination: { ...state.pagination, ...pagination }
  })),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  resetFilters: () => set({
    filters: initialFilters,
    pagination: { ...initialPagination, limit: get().pagination.limit }
  }),

  // Computed values
  getFilteredClients: () => {
    const { clients, filters } = get()
    return clients.filter(client => {
      const searchLower = filters.search.toLowerCase()
      const matchesSearch = !filters.search ||
        client.name.toLowerCase().includes(searchLower) ||
        client.email.toLowerCase().includes(searchLower) ||
        (client.company && client.company.toLowerCase().includes(searchLower))

      const matchesCompany = !filters.company ||
        (client.company && client.company.toLowerCase().includes(filters.company.toLowerCase()))

      return matchesSearch && matchesCompany
    })
  },

  getClientStats: () => {
    const { clients } = get()
    const companies = new Set(clients.map(c => c.company).filter(Boolean)).size

    return {
      total: clients.length,
      activeTickets: clients.reduce((sum, client) => sum + client.activeTickets, 0),
      companies
    }
  }
}))

// Utility function for creating new client data
export const createClientData = (data: Partial<Client>): Omit<ClientWithStats, 'id' | 'createdAt' | 'updatedAt'> => ({
  name: data.name || '',
  email: data.email || '',
  phone: data.phone || null,
  company: data.company || null,
  whatsappId: data.whatsappId || null,
  zohoCrmContactId: data.zohoCrmContactId || null,
  zohoBooksContactId: data.zohoBooksContactId || null,
  zohoSyncedAt: data.zohoSyncedAt || null,
  zohoSyncStatus: data.zohoSyncStatus || 'PENDING',
  zohoSyncError: data.zohoSyncError || null,
  activeTickets: 0,
  totalTickets: 0,
  totalQuotes: 0,
  totalInvoices: 0
})