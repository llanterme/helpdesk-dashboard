import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

// Types
export interface QuoteItem {
  id: string
  quoteId: string
  serviceId: string
  quantity: number
  rate: number
  lineTotal: number
  customDescription?: string
  service: {
    id: string
    name: string
    description: string
    category: string
    sku: string
    unit: string
    rate: number
  }
}

export interface QuoteStatusLog {
  id: string
  quoteId: string
  status: QuoteStatus
  changedBy?: string
  notes?: string
  createdAt: string
}

export interface Quote {
  id: string
  number: string
  clientId: string
  agentId?: string
  status: QuoteStatus
  subtotal: number
  taxRate: number
  taxAmount: number
  discountRate: number
  discountAmount: number
  totalAmount: number
  notes?: string
  terms?: string
  validUntil?: string
  sentAt?: string
  acceptedAt?: string
  expiredAt?: string
  createdAt: string
  updatedAt: string

  // Relations
  client: {
    id: string
    name: string
    email: string
    phone?: string
    company?: string
  }
  agent?: {
    id: string
    name: string
    email: string
    color?: string
  }
  items: QuoteItem[]
  statusLogs: QuoteStatusLog[]
  invoice?: {
    id: string
    status: string
    totalAmount: number
    dueDate?: string
    createdAt: string
  }
  _count?: {
    items: number
  }
}

export type QuoteStatus = 'DRAFT' | 'SENT' | 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'

export interface QuoteFilters {
  search: string
  status: string
  agentId: string
  clientId: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

export interface QuotePagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface QuoteCart {
  items: Array<{
    serviceId: string
    quantity: number
    rate?: number
    customDescription?: string
  }>
  clientId: string
  agentId?: string
  taxRate: number
  discountRate: number
  notes?: string
  terms?: string
  validUntil?: string
}

interface QuoteStore {
  // State
  quotes: Quote[]
  selectedQuote: Quote | null
  cart: QuoteCart
  isLoading: boolean
  error: string | null
  filters: QuoteFilters
  pagination: QuotePagination

  // Cache management
  lastFetched: Date
  cacheTimeout: number

  // Actions
  fetchQuotes: () => Promise<void>
  fetchQuote: (id: string) => Promise<void>
  createQuote: (data: Partial<Quote>) => Promise<Quote>
  updateQuote: (id: string, data: Partial<Quote>) => Promise<Quote>
  deleteQuote: (id: string) => Promise<void>
  updateQuoteStatus: (id: string, status: QuoteStatus, notes?: string, agentId?: string) => Promise<Quote>
  convertQuoteToInvoice: (id: string, dueDate?: string, agentId?: string) => Promise<any>

  // Quote items management
  addQuoteItem: (quoteId: string, item: { serviceId: string; quantity: number; rate?: number; customDescription?: string }) => Promise<QuoteItem>
  updateQuoteItem: (quoteId: string, itemId: string, updates: Partial<QuoteItem>) => Promise<QuoteItem>
  removeQuoteItem: (quoteId: string, itemId: string) => Promise<void>

  // Cart management
  initializeCart: (clientId: string, agentId?: string) => void
  addToCart: (serviceId: string, quantity?: number, rate?: number, customDescription?: string) => void
  updateCartItem: (serviceId: string, updates: { quantity?: number; rate?: number; customDescription?: string }) => void
  removeFromCart: (serviceId: string) => void
  updateCartSettings: (settings: Partial<QuoteCart>) => void
  clearCart: () => void

  // Cart calculations
  calculateCartSubtotal: () => number
  calculateCartTotals: () => { subtotal: number; discountAmount: number; taxAmount: number; totalAmount: number }

  // Filtering and search
  setFilters: (filters: Partial<QuoteFilters>) => void
  resetFilters: () => void
  setPagination: (pagination: Partial<QuotePagination>) => void

  // Utility functions
  clearError: () => void
  setSelectedQuote: (quote: Quote | null) => void
  isCacheValid: () => boolean
  refreshCache: () => Promise<void>
}

// Quote utilities
export const quoteUtils = {
  formatQuoteNumber: (number: string) => number,

  formatStatus: (status: QuoteStatus) => {
    const statusLabels: { [key in QuoteStatus]: string } = {
      DRAFT: 'Draft',
      SENT: 'Sent',
      PENDING: 'Pending',
      ACCEPTED: 'Accepted',
      REJECTED: 'Rejected',
      EXPIRED: 'Expired'
    }
    return statusLabels[status]
  },

  getStatusColor: (status: QuoteStatus) => {
    const colors: { [key in QuoteStatus]: string } = {
      DRAFT: '#6B7280', // gray-500
      SENT: '#3B82F6', // blue-500
      PENDING: '#F59E0B', // amber-500
      ACCEPTED: '#10B981', // emerald-500
      REJECTED: '#EF4444', // red-500
      EXPIRED: '#9CA3AF' // gray-400
    }
    return colors[status]
  },

  canEdit: (quote: Quote) => {
    return !['ACCEPTED', 'EXPIRED'].includes(quote.status)
  },

  canDelete: (quote: Quote) => {
    return !quote.invoice && quote.status !== 'ACCEPTED'
  },

  canConvert: (quote: Quote) => {
    return quote.status === 'ACCEPTED' && !quote.invoice
  },

  isExpired: (quote: Quote) => {
    if (!quote.validUntil) return false
    return new Date(quote.validUntil) < new Date()
  },

  formatAmount: (amount: number) => {
    return `R${amount.toFixed(2)}`
  },

  calculateItemTotal: (quantity: number, rate: number) => {
    return Math.round(quantity * rate * 100) / 100
  },

  calculateDiscountAmount: (subtotal: number, discountRate: number) => {
    return Math.round((subtotal * discountRate / 100) * 100) / 100
  },

  calculateTaxAmount: (subtotalAfterDiscount: number, taxRate: number) => {
    return Math.round((subtotalAfterDiscount * taxRate / 100) * 100) / 100
  },

  calculateTotalAmount: (subtotal: number, taxRate: number, discountRate: number) => {
    const discountAmount = quoteUtils.calculateDiscountAmount(subtotal, discountRate)
    const subtotalAfterDiscount = subtotal - discountAmount
    const taxAmount = quoteUtils.calculateTaxAmount(subtotalAfterDiscount, taxRate)
    return {
      discountAmount,
      taxAmount,
      totalAmount: Math.round((subtotalAfterDiscount + taxAmount) * 100) / 100
    }
  },

  filterQuotes: (quotes: Quote[], filters: QuoteFilters) => {
    return quotes.filter(quote => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesSearch =
          quote.number.toLowerCase().includes(searchLower) ||
          quote.notes?.toLowerCase().includes(searchLower) ||
          quote.client?.name?.toLowerCase().includes(searchLower) ||
          quote.client?.company?.toLowerCase().includes(searchLower) ||
          quote.agent?.name?.toLowerCase().includes(searchLower)

        if (!matchesSearch) return false
      }

      // Status filter
      if (filters.status !== 'all' && quote.status !== filters.status) {
        return false
      }

      // Agent filter
      if (filters.agentId !== 'all' && quote.agentId !== filters.agentId) {
        return false
      }

      // Client filter
      if (filters.clientId !== 'all' && quote.clientId !== filters.clientId) {
        return false
      }

      return true
    })
  },

  sortQuotes: (quotes: Quote[], sortBy: string, sortOrder: 'asc' | 'desc') => {
    const sorted = [...quotes].sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case 'number':
          aValue = a.number
          bValue = b.number
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
        case 'validUntil':
          aValue = new Date(a.validUntil || 0)
          bValue = new Date(b.validUntil || 0)
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
const defaultFilters: QuoteFilters = {
  search: '',
  status: 'all',
  agentId: 'all',
  clientId: 'all',
  sortBy: 'createdAt',
  sortOrder: 'desc'
}

// Default pagination
const defaultPagination: QuotePagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false
}

// Default cart
const defaultCart: QuoteCart = {
  items: [],
  clientId: '',
  agentId: undefined,
  taxRate: 15.0, // South African VAT rate
  discountRate: 0,
  notes: undefined,
  terms: undefined,
  validUntil: undefined
}

export const useQuoteStore = create<QuoteStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      quotes: [],
      selectedQuote: null,
      cart: { ...defaultCart },
      isLoading: false,
      error: null,
      filters: { ...defaultFilters },
      pagination: { ...defaultPagination },
      lastFetched: new Date(0),
      cacheTimeout: 30000, // 30 seconds

      // Cache management
      isCacheValid: () => {
        const { lastFetched, cacheTimeout } = get()
        return Date.now() - lastFetched.getTime() < cacheTimeout
      },

      refreshCache: async () => {
        await get().fetchQuotes()
      },

      // Fetch quotes with filtering
      fetchQuotes: async () => {
        const { filters, pagination, isCacheValid } = get()

        if (isCacheValid()) {
          return
        }

        set({ isLoading: true, error: null })

        try {
          const params = new URLSearchParams({
            search: filters.search,
            status: filters.status,
            agentId: filters.agentId,
            clientId: filters.clientId,
            sortBy: filters.sortBy,
            sortOrder: filters.sortOrder,
            page: pagination.page.toString(),
            limit: pagination.limit.toString()
          })

          const response = await fetch(`/api/quotes?${params}`)

          if (!response.ok) {
            throw new Error(`Failed to fetch quotes: ${response.statusText}`)
          }

          const data = await response.json()

          set({
            quotes: data.quotes,
            pagination: data.pagination,
            isLoading: false,
            lastFetched: new Date()
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch quotes',
            isLoading: false
          })
        }
      },

      // Fetch single quote
      fetchQuote: async (id: string) => {
        set({ isLoading: true, error: null })

        try {
          const response = await fetch(`/api/quotes/${id}`)

          if (!response.ok) {
            throw new Error(`Failed to fetch quote: ${response.statusText}`)
          }

          const quote = await response.json()

          set({
            selectedQuote: quote,
            isLoading: false
          })

          // Update quote in quotes array if it exists
          const { quotes } = get()
          const updatedQuotes = quotes.map(q => q.id === id ? quote : q)
          set({ quotes: updatedQuotes })

        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch quote',
            isLoading: false
          })
        }
      },

      // Create quote
      createQuote: async (data: Partial<Quote>) => {
        set({ isLoading: true, error: null })

        try {
          const response = await fetch('/api/quotes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to create quote')
          }

          const quote = await response.json()

          // Add quote to quotes array
          const { quotes } = get()
          set({
            quotes: [quote, ...quotes],
            selectedQuote: quote,
            isLoading: false
          })

          return quote
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to create quote',
            isLoading: false
          })
          throw error
        }
      },

      // Update quote
      updateQuote: async (id: string, data: Partial<Quote>) => {
        set({ isLoading: true, error: null })

        try {
          const response = await fetch(`/api/quotes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to update quote')
          }

          const updatedQuote = await response.json()

          // Update quote in quotes array and selected quote
          const { quotes, selectedQuote } = get()
          const updatedQuotes = quotes.map(q => q.id === id ? updatedQuote : q)

          set({
            quotes: updatedQuotes,
            selectedQuote: selectedQuote?.id === id ? updatedQuote : selectedQuote,
            isLoading: false
          })

          return updatedQuote
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update quote',
            isLoading: false
          })
          throw error
        }
      },

      // Delete quote
      deleteQuote: async (id: string) => {
        set({ isLoading: true, error: null })

        try {
          const response = await fetch(`/api/quotes/${id}`, {
            method: 'DELETE'
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to delete quote')
          }

          // Remove quote from quotes array
          const { quotes, selectedQuote } = get()
          const updatedQuotes = quotes.filter(q => q.id !== id)

          set({
            quotes: updatedQuotes,
            selectedQuote: selectedQuote?.id === id ? null : selectedQuote,
            isLoading: false
          })

        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to delete quote',
            isLoading: false
          })
          throw error
        }
      },

      // Update quote status
      updateQuoteStatus: async (id: string, status: QuoteStatus, notes?: string, agentId?: string) => {
        set({ isLoading: true, error: null })

        try {
          const response = await fetch(`/api/quotes/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, notes, agentId })
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to update quote status')
          }

          const updatedQuote = await response.json()

          // Update quote in quotes array and selected quote
          const { quotes, selectedQuote } = get()
          const updatedQuotes = quotes.map(q => q.id === id ? updatedQuote : q)

          set({
            quotes: updatedQuotes,
            selectedQuote: selectedQuote?.id === id ? updatedQuote : selectedQuote,
            isLoading: false
          })

          return updatedQuote
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update quote status',
            isLoading: false
          })
          throw error
        }
      },

      // Convert quote to invoice
      convertQuoteToInvoice: async (id: string, dueDate?: string, agentId?: string) => {
        set({ isLoading: true, error: null })

        try {
          const response = await fetch(`/api/quotes/${id}/convert`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dueDate, agentId })
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to convert quote to invoice')
          }

          const result = await response.json()

          // Refresh the quote to show the invoice relationship
          await get().fetchQuote(id)

          set({ isLoading: false })
          return result

        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to convert quote to invoice',
            isLoading: false
          })
          throw error
        }
      },

      // Add quote item
      addQuoteItem: async (quoteId: string, item: { serviceId: string; quantity: number; rate?: number; customDescription?: string }) => {
        set({ isLoading: true, error: null })

        try {
          const response = await fetch(`/api/quotes/${quoteId}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to add quote item')
          }

          const quoteItem = await response.json()

          // Refresh the quote to get updated totals
          await get().fetchQuote(quoteId)

          set({ isLoading: false })
          return quoteItem

        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to add quote item',
            isLoading: false
          })
          throw error
        }
      },

      // Update quote item
      updateQuoteItem: async (quoteId: string, itemId: string, updates: Partial<QuoteItem>) => {
        // This would require a separate API endpoint
        throw new Error('Not implemented yet')
      },

      // Remove quote item
      removeQuoteItem: async (quoteId: string, itemId: string) => {
        // This would require a separate API endpoint
        throw new Error('Not implemented yet')
      },

      // Initialize cart
      initializeCart: (clientId: string, agentId?: string) => {
        set({
          cart: {
            ...defaultCart,
            clientId,
            agentId
          }
        })
      },

      // Add to cart
      addToCart: (serviceId: string, quantity = 1, rate?: number, customDescription?: string) => {
        const { cart } = get()

        // Check if item already exists in cart
        const existingItemIndex = cart.items.findIndex(item => item.serviceId === serviceId)

        if (existingItemIndex >= 0) {
          // Update existing item
          const updatedItems = [...cart.items]
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: updatedItems[existingItemIndex].quantity + quantity,
            ...(rate !== undefined && { rate }),
            ...(customDescription !== undefined && { customDescription })
          }

          set({
            cart: {
              ...cart,
              items: updatedItems
            }
          })
        } else {
          // Add new item
          const newItem = {
            serviceId,
            quantity,
            ...(rate !== undefined && { rate }),
            ...(customDescription !== undefined && { customDescription })
          }

          set({
            cart: {
              ...cart,
              items: [...cart.items, newItem]
            }
          })
        }
      },

      // Update cart item
      updateCartItem: (serviceId: string, updates: { quantity?: number; rate?: number; customDescription?: string }) => {
        const { cart } = get()
        const updatedItems = cart.items.map(item =>
          item.serviceId === serviceId
            ? { ...item, ...updates }
            : item
        )

        set({
          cart: {
            ...cart,
            items: updatedItems
          }
        })
      },

      // Remove from cart
      removeFromCart: (serviceId: string) => {
        const { cart } = get()
        const updatedItems = cart.items.filter(item => item.serviceId !== serviceId)

        set({
          cart: {
            ...cart,
            items: updatedItems
          }
        })
      },

      // Update cart settings
      updateCartSettings: (settings: Partial<QuoteCart>) => {
        const { cart } = get()
        set({
          cart: {
            ...cart,
            ...settings
          }
        })
      },

      // Clear cart
      clearCart: () => {
        set({ cart: { ...defaultCart } })
      },

      // Calculate cart subtotal
      calculateCartSubtotal: () => {
        const { cart } = get()
        return cart.items.reduce((total, item) => {
          // This would need to fetch service rates if not provided
          const rate = item.rate || 0
          return total + (item.quantity * rate)
        }, 0)
      },

      // Calculate cart totals
      calculateCartTotals: () => {
        const subtotal = get().calculateCartSubtotal()
        const { cart } = get()
        return quoteUtils.calculateTotalAmount(subtotal, cart.taxRate, cart.discountRate)
      },

      // Set filters
      setFilters: (newFilters: Partial<QuoteFilters>) => {
        const { filters } = get()
        set({
          filters: { ...filters, ...newFilters },
          pagination: { ...defaultPagination }
        })

        // Trigger refetch
        get().fetchQuotes()
      },

      // Reset filters
      resetFilters: () => {
        set({
          filters: { ...defaultFilters },
          pagination: { ...defaultPagination }
        })

        // Trigger refetch
        get().fetchQuotes()
      },

      // Set pagination
      setPagination: (newPagination: Partial<QuotePagination>) => {
        const { pagination } = get()
        set({
          pagination: { ...pagination, ...newPagination }
        })

        // Trigger refetch
        get().fetchQuotes()
      },

      // Clear error
      clearError: () => {
        set({ error: null })
      },

      // Set selected quote
      setSelectedQuote: (quote: Quote | null) => {
        set({ selectedQuote: quote })
      }
    }),
    {
      name: 'quote-store'
    }
  )
)