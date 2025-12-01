import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

// Types
export interface InvoiceItem {
  id: string
  invoiceId: string
  serviceId: string
  quantity: number
  rate: number
  lineTotal: number
  service?: {
    id: string
    name: string
    category: string
    description?: string
    unit?: string
  }
}

export interface Invoice {
  id: string
  quoteId?: string | null
  clientId: string
  agentId?: string | null
  status: InvoiceStatus
  totalAmount: number
  dueDate?: string | null
  paidDate?: string | null
  createdAt: string
  updatedAt: string

  // Relations
  client?: {
    id: string
    name: string
    company?: string
    email: string
    phone?: string
    address?: string
  }
  agent?: {
    id: string
    name: string
    email: string
    phone?: string
  }
  quote?: {
    id: string
    number: string
    status: string
    notes?: string
    terms?: string
  }
  items: InvoiceItem[]
  bill?: {
    id: string
    status: string
    totalAmount: number
    createdAt: string
  }
}

export type InvoiceStatus = 'PENDING' | 'SENT' | 'PAID' | 'OVERDUE'

export interface InvoiceFilters {
  search: string
  status: string
  agentId: string
  clientId: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

export interface InvoicePagination {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface InvoiceFormData {
  clientId: string
  agentId?: string
  totalAmount: number
  dueDate?: string
  items: {
    serviceId: string
    quantity: number
    rate: number
  }[]
}

// Store interface
interface InvoiceStore {
  // State
  invoices: Invoice[]
  selectedInvoice: Invoice | null
  isLoading: boolean
  error: string | null

  // Filtering and pagination
  filters: InvoiceFilters
  pagination: InvoicePagination

  // Actions
  fetchInvoices: () => Promise<void>
  fetchInvoiceById: (id: string) => Promise<Invoice>
  createInvoice: (data: InvoiceFormData) => Promise<Invoice>
  updateInvoice: (id: string, data: Partial<InvoiceFormData>) => Promise<Invoice>
  deleteInvoice: (id: string) => Promise<void>
  updateInvoiceStatus: (id: string, status: InvoiceStatus, paidDate?: string) => Promise<Invoice>
  convertQuoteToInvoice: (quoteId: string, dueDate?: string, agentId?: string) => Promise<Invoice>

  // UI helpers
  setSelectedInvoice: (invoice: Invoice | null) => void
  setFilters: (filters: Partial<InvoiceFilters>) => void
  setPagination: (pagination: Partial<InvoicePagination>) => void
  resetFilters: () => void
  clearError: () => void
}

// Invoice utilities
export const invoiceUtils = {
  formatInvoiceNumber: (id: string) => `INV-${id.slice(-8).toUpperCase()}`,

  formatStatus: (status: InvoiceStatus) => {
    const statusLabels: { [key in InvoiceStatus]: string } = {
      PENDING: 'Pending',
      SENT: 'Sent',
      PAID: 'Paid',
      OVERDUE: 'Overdue'
    }
    return statusLabels[status]
  },

  getStatusColor: (status: InvoiceStatus) => {
    const colors: { [key in InvoiceStatus]: string } = {
      PENDING: '#F59E0B', // amber-500
      SENT: '#3B82F6', // blue-500
      PAID: '#10B981', // emerald-500
      OVERDUE: '#EF4444' // red-500
    }
    return colors[status]
  },

  canEdit: (invoice: Invoice) => {
    return invoice.status !== 'PAID'
  },

  canDelete: (invoice: Invoice) => {
    return invoice.status !== 'PAID' && !invoice.bill
  },

  canMarkPaid: (invoice: Invoice) => {
    return ['PENDING', 'SENT', 'OVERDUE'].includes(invoice.status)
  },

  isOverdue: (invoice: Invoice) => {
    if (!invoice.dueDate || invoice.status === 'PAID') return false
    return new Date(invoice.dueDate) < new Date() && invoice.status !== 'OVERDUE'
  },

  formatAmount: (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2
    }).format(amount)
  },

  calculateItemTotal: (quantity: number, rate: number) => {
    return Math.round(quantity * rate * 100) / 100
  },

  calculateInvoiceTotal: (items: InvoiceItem[]) => {
    return items.reduce((total, item) => total + item.lineTotal, 0)
  },

  getDaysPastDue: (invoice: Invoice) => {
    if (!invoice.dueDate || invoice.status === 'PAID') return 0
    const dueDate = new Date(invoice.dueDate)
    const today = new Date()
    const diffTime = today.getTime() - dueDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  },

  filterInvoices: (invoices: Invoice[], filters: InvoiceFilters) => {
    return invoices.filter(invoice => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesSearch =
          invoice.id.toLowerCase().includes(searchLower) ||
          invoiceUtils.formatInvoiceNumber(invoice.id).toLowerCase().includes(searchLower) ||
          invoice.client?.name?.toLowerCase().includes(searchLower) ||
          invoice.client?.company?.toLowerCase().includes(searchLower) ||
          invoice.agent?.name?.toLowerCase().includes(searchLower) ||
          invoice.quote?.number?.toLowerCase().includes(searchLower)

        if (!matchesSearch) return false
      }

      // Status filter
      if (filters.status !== 'all' && invoice.status !== filters.status) {
        return false
      }

      // Agent filter
      if (filters.agentId !== 'all' && invoice.agentId !== filters.agentId) {
        return false
      }

      // Client filter
      if (filters.clientId !== 'all' && invoice.clientId !== filters.clientId) {
        return false
      }

      return true
    })
  },

  sortInvoices: (invoices: Invoice[], sortBy: string, sortOrder: 'asc' | 'desc') => {
    const sorted = [...invoices].sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case 'id':
          aValue = invoiceUtils.formatInvoiceNumber(a.id)
          bValue = invoiceUtils.formatInvoiceNumber(b.id)
          break
        case 'client':
          aValue = a.client?.name || ''
          bValue = b.client?.name || ''
          break
        case 'agent':
          aValue = a.agent?.name || ''
          bValue = b.agent?.name || ''
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        case 'totalAmount':
          aValue = a.totalAmount
          bValue = b.totalAmount
          break
        case 'dueDate':
          aValue = new Date(a.dueDate || 0)
          bValue = new Date(b.dueDate || 0)
          break
        case 'paidDate':
          aValue = new Date(a.paidDate || 0)
          bValue = new Date(b.paidDate || 0)
          break
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt)
          bValue = new Date(b.createdAt)
          break
      }

      // Handle different data types
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      if (aValue instanceof Date && bValue instanceof Date) {
        return sortOrder === 'asc'
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime()
      }

      // For numbers and other types
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return bValue < aValue ? -1 : bValue > aValue ? 1 : 0
      }
    })

    return sorted
  }
}

// Default filters
const defaultFilters: InvoiceFilters = {
  search: '',
  status: 'all',
  agentId: 'all',
  clientId: 'all',
  sortBy: 'createdAt',
  sortOrder: 'desc'
}

// Default pagination
const defaultPagination: InvoicePagination = {
  page: 1,
  limit: 10,
  totalCount: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false
}

// Create the store
export const useInvoiceStore = create<InvoiceStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      invoices: [],
      selectedInvoice: null,
      isLoading: false,
      error: null,
      filters: defaultFilters,
      pagination: defaultPagination,

      // Fetch invoices with filters and pagination
      fetchInvoices: async () => {
        set({ isLoading: true, error: null })

        try {
          const { filters, pagination } = get()
          const params = new URLSearchParams({
            page: pagination.page.toString(),
            limit: pagination.limit.toString(),
            search: filters.search,
            status: filters.status,
            agentId: filters.agentId,
            clientId: filters.clientId,
            sortBy: filters.sortBy,
            sortOrder: filters.sortOrder
          })

          const response = await fetch(`/api/invoices?${params}`)

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to fetch invoices')
          }

          const data = await response.json()

          set({
            invoices: data.invoices,
            pagination: data.pagination,
            isLoading: false
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch invoices',
            isLoading: false
          })
          throw error
        }
      },

      // Fetch invoice by ID
      fetchInvoiceById: async (id: string) => {
        set({ isLoading: true, error: null })

        try {
          const response = await fetch(`/api/invoices/${id}`)

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to fetch invoice')
          }

          const invoice = await response.json()

          set({
            selectedInvoice: invoice,
            isLoading: false
          })

          return invoice
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch invoice',
            isLoading: false
          })
          throw error
        }
      },

      // Create new invoice
      createInvoice: async (data: InvoiceFormData) => {
        set({ isLoading: true, error: null })

        try {
          const response = await fetch('/api/invoices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to create invoice')
          }

          const newInvoice = await response.json()

          // Add to invoices array
          const { invoices } = get()
          set({
            invoices: [newInvoice, ...invoices],
            selectedInvoice: newInvoice,
            isLoading: false
          })

          return newInvoice
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to create invoice',
            isLoading: false
          })
          throw error
        }
      },

      // Update invoice
      updateInvoice: async (id: string, data: Partial<InvoiceFormData>) => {
        set({ isLoading: true, error: null })

        try {
          const response = await fetch(`/api/invoices/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to update invoice')
          }

          const updatedInvoice = await response.json()

          // Update invoice in invoices array and selected invoice
          const { invoices, selectedInvoice } = get()
          const updatedInvoices = invoices.map(i => i.id === id ? updatedInvoice : i)

          set({
            invoices: updatedInvoices,
            selectedInvoice: selectedInvoice?.id === id ? updatedInvoice : selectedInvoice,
            isLoading: false
          })

          return updatedInvoice
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update invoice',
            isLoading: false
          })
          throw error
        }
      },

      // Delete invoice
      deleteInvoice: async (id: string) => {
        set({ isLoading: true, error: null })

        try {
          const response = await fetch(`/api/invoices/${id}`, {
            method: 'DELETE'
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to delete invoice')
          }

          // Remove from invoices array and clear selected if it was the deleted invoice
          const { invoices, selectedInvoice } = get()
          const updatedInvoices = invoices.filter(i => i.id !== id)

          set({
            invoices: updatedInvoices,
            selectedInvoice: selectedInvoice?.id === id ? null : selectedInvoice,
            isLoading: false
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to delete invoice',
            isLoading: false
          })
          throw error
        }
      },

      // Update invoice status
      updateInvoiceStatus: async (id: string, status: InvoiceStatus, paidDate?: string) => {
        set({ isLoading: true, error: null })

        try {
          const response = await fetch(`/api/invoices/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, paidDate })
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to update invoice status')
          }

          const updatedInvoice = await response.json()

          // Update invoice in invoices array and selected invoice
          const { invoices, selectedInvoice } = get()
          const updatedInvoices = invoices.map(i => i.id === id ? updatedInvoice : i)

          set({
            invoices: updatedInvoices,
            selectedInvoice: selectedInvoice?.id === id ? updatedInvoice : selectedInvoice,
            isLoading: false
          })

          return updatedInvoice
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update invoice status',
            isLoading: false
          })
          throw error
        }
      },

      // Convert quote to invoice
      convertQuoteToInvoice: async (quoteId: string, dueDate?: string, agentId?: string) => {
        set({ isLoading: true, error: null })

        try {
          const response = await fetch('/api/invoices/convert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quoteId, dueDate, agentId })
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to convert quote to invoice')
          }

          const newInvoice = await response.json()

          // Add to invoices array
          const { invoices } = get()
          set({
            invoices: [newInvoice, ...invoices],
            selectedInvoice: newInvoice,
            isLoading: false
          })

          return newInvoice
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to convert quote to invoice',
            isLoading: false
          })
          throw error
        }
      },

      // UI helpers
      setSelectedInvoice: (invoice: Invoice | null) => {
        set({ selectedInvoice: invoice })
      },

      setFilters: (newFilters: Partial<InvoiceFilters>) => {
        set(state => ({
          filters: { ...state.filters, ...newFilters },
          pagination: { ...defaultPagination } // Reset pagination when filters change
        }))
      },

      setPagination: (newPagination: Partial<InvoicePagination>) => {
        set(state => ({
          pagination: { ...state.pagination, ...newPagination }
        }))
      },

      resetFilters: () => {
        set({
          filters: defaultFilters,
          pagination: defaultPagination
        })
      },

      clearError: () => {
        set({ error: null })
      }
    }),
    {
      name: 'invoice-store'
    }
  )
)