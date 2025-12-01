import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export interface Service {
  id: string
  name: string
  category: string
  description?: string
  rate: number
  unit: string
  sku: string
  active: boolean
  createdAt: Date | string
  updatedAt: Date | string
  _count?: {
    quoteItems: number
    invoiceItems: number
  }
  // For detailed view
  quoteItems?: Array<{
    id: string
    quantity: number
    rate: number
    quote: {
      id: string
      number: string
      client: {
        name: string
        company?: string
      }
    }
  }>
  invoiceItems?: Array<{
    id: string
    quantity: number
    rate: number
    invoice: {
      id: string
      number: string
      client: {
        name: string
        company?: string
      }
    }
  }>
}

export interface ServiceCategory {
  name: string
  totalServices: number
  activeServices: number
  inactiveServices: number
  averageRate: number
  minRate: number
  maxRate: number
  rateRange: {
    min: number
    max: number
    average: number
  }
}

export interface ServiceFilters {
  search: string
  category: string
  active?: boolean
  minRate?: number
  maxRate?: number
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

export interface ServiceSummary {
  totalCategories: number
  totalServices: number
  activeServices: number
  inactiveServices: number
}

export interface PricingCalculation {
  serviceId: string
  quantity: number
  rate: number
  total: number
  discount?: {
    type: 'percentage' | 'fixed'
    value: number
    amount: number
  }
  finalTotal: number
}

interface ServiceState {
  // Services data
  services: Service[]
  selectedService?: Service

  // Categories data
  categories: ServiceCategory[]
  categorySummary?: ServiceSummary

  // UI state
  isLoading: boolean
  error?: string

  // Filters and search
  filters: ServiceFilters

  // Pricing calculations
  calculations: PricingCalculation[]

  // Cache management
  lastFetched?: Date
  cacheTimeout: number // milliseconds
}

interface ServiceActions {
  // Data fetching
  fetchServices: (forceRefresh?: boolean) => Promise<void>
  fetchService: (id: string) => Promise<Service | null>
  fetchCategories: (includeInactive?: boolean) => Promise<void>

  // CRUD operations
  createService: (data: Omit<Service, 'id' | 'createdAt' | 'updatedAt' | '_count'>) => Promise<Service | null>
  updateService: (id: string, data: Partial<Service>) => Promise<Service | null>
  deleteService: (id: string) => Promise<boolean>
  toggleServiceStatus: (id: string) => Promise<boolean>

  // Category operations
  updateCategory: (oldCategory: string, newCategory: string, serviceIds?: string[]) => Promise<boolean>
  deleteCategory: (category: string, newCategory: string) => Promise<boolean>

  // Search and filtering
  setFilters: (filters: Partial<ServiceFilters>) => void
  clearFilters: () => void

  // Pricing calculations
  calculatePrice: (serviceId: string, quantity: number, discount?: PricingCalculation['discount']) => PricingCalculation | null
  addCalculation: (calculation: PricingCalculation) => void
  removeCalculation: (serviceId: string) => void
  clearCalculations: () => void
  getTotalCalculation: () => number

  // Utility functions
  setSelectedService: (service?: Service) => void
  clearError: () => void

  // Cache management
  isCacheValid: () => boolean
  invalidateCache: () => void
}

export interface ServiceStore extends ServiceState, ServiceActions {}

// Default filters
const defaultFilters: ServiceFilters = {
  search: '',
  category: 'all',
  active: true,
  sortBy: 'name',
  sortOrder: 'asc'
}

// Service utility functions
export const serviceUtils = {
  formatRate: (rate: number, unit?: string) => {
    const formatter = new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2
    })
    return unit ? `${formatter.format(rate)} ${unit}` : formatter.format(rate)
  },

  formatSku: (sku: string) => {
    return sku.toUpperCase()
  },

  generateSku: (name: string, category: string) => {
    const categoryPrefix = category.substring(0, 3).toUpperCase()
    const namePrefix = name.substring(0, 3).toUpperCase()
    const timestamp = Date.now().toString().slice(-6)
    return `${categoryPrefix}-${namePrefix}-${timestamp}`
  },

  getCategoryColor: (category: string) => {
    // Generate consistent colors for categories
    const colors = [
      '#3B82F6', // blue
      '#10B981', // emerald
      '#F59E0B', // amber
      '#EF4444', // red
      '#8B5CF6', // violet
      '#06B6D4', // cyan
      '#84CC16', // lime
      '#F97316', // orange
    ]

    let hash = 0
    for (let i = 0; i < category.length; i++) {
      hash = category.charCodeAt(i) + ((hash << 5) - hash)
    }

    return colors[Math.abs(hash) % colors.length]
  },

  filterServices: (services: Service[], filters: ServiceFilters) => {
    return services.filter(service => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matches =
          service.name.toLowerCase().includes(searchLower) ||
          service.description?.toLowerCase().includes(searchLower) ||
          service.sku.toLowerCase().includes(searchLower) ||
          service.category.toLowerCase().includes(searchLower)

        if (!matches) return false
      }

      // Category filter
      if (filters.category && filters.category !== 'all') {
        if (service.category !== filters.category) return false
      }

      // Active status filter
      if (filters.active !== undefined) {
        if (service.active !== filters.active) return false
      }

      // Rate range filters
      if (filters.minRate !== undefined && service.rate < filters.minRate) return false
      if (filters.maxRate !== undefined && service.rate > filters.maxRate) return false

      return true
    })
  },

  sortServices: (services: Service[], sortBy: string, sortOrder: 'asc' | 'desc') => {
    return [...services].sort((a, b) => {
      let aValue: any = a[sortBy as keyof Service]
      let bValue: any = b[sortBy as keyof Service]

      // Handle nested properties
      if (sortBy === 'usage') {
        aValue = (a._count?.quoteItems || 0) + (a._count?.invoiceItems || 0)
        bValue = (b._count?.quoteItems || 0) + (b._count?.invoiceItems || 0)
      }

      // Convert to comparable values
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
  }
}

export const useServiceStore = create<ServiceStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      services: [],
      selectedService: undefined,
      categories: [],
      categorySummary: undefined,
      isLoading: false,
      error: undefined,
      filters: defaultFilters,
      calculations: [],
      cacheTimeout: 5 * 60 * 1000, // 5 minutes

      // Cache management
      isCacheValid: () => {
        const { lastFetched, cacheTimeout } = get()
        if (!lastFetched) return false
        return Date.now() - lastFetched.getTime() < cacheTimeout
      },

      invalidateCache: () => {
        set({ lastFetched: undefined })
      },

      // Fetch all services
      fetchServices: async (forceRefresh = false) => {
        const state = get()

        // Check cache unless forced refresh
        if (!forceRefresh && state.isCacheValid() && state.services.length > 0) {
          return
        }

        set({ isLoading: true, error: undefined })

        try {
          const { filters } = state
          const params = new URLSearchParams()

          if (filters.category !== 'all') params.set('category', filters.category)
          if (filters.active !== undefined) params.set('active', filters.active.toString())
          if (filters.search) params.set('search', filters.search)
          params.set('sortBy', filters.sortBy)
          params.set('sortOrder', filters.sortOrder)

          const response = await fetch(`/api/services?${params}`)

          if (!response.ok) {
            throw new Error('Failed to fetch services')
          }

          const data = await response.json()

          set({
            services: data.services.map((service: any) => ({
              ...service,
              createdAt: new Date(service.createdAt),
              updatedAt: new Date(service.updatedAt)
            })),
            categories: data.categories || [],
            isLoading: false,
            lastFetched: new Date()
          })
        } catch (error) {
          console.error('Error fetching services:', error)
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch services',
            isLoading: false
          })
        }
      },

      // Fetch single service
      fetchService: async (id: string) => {
        set({ isLoading: true, error: undefined })

        try {
          const response = await fetch(`/api/services/${id}`)

          if (!response.ok) {
            throw new Error('Failed to fetch service')
          }

          const service = await response.json()

          set(state => ({
            services: state.services.map(s => s.id === id ? {
              ...service,
              createdAt: new Date(service.createdAt),
              updatedAt: new Date(service.updatedAt)
            } : s),
            selectedService: {
              ...service,
              createdAt: new Date(service.createdAt),
              updatedAt: new Date(service.updatedAt)
            },
            isLoading: false
          }))

          return service
        } catch (error) {
          console.error('Error fetching service:', error)
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch service',
            isLoading: false
          })
          return null
        }
      },

      // Fetch categories
      fetchCategories: async (includeInactive = false) => {
        set({ isLoading: true, error: undefined })

        try {
          const params = includeInactive ? '?includeInactive=true' : ''
          const response = await fetch(`/api/services/categories${params}`)

          if (!response.ok) {
            throw new Error('Failed to fetch categories')
          }

          const data = await response.json()

          set({
            categories: data.categories,
            categorySummary: data.summary,
            isLoading: false
          })
        } catch (error) {
          console.error('Error fetching categories:', error)
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch categories',
            isLoading: false
          })
        }
      },

      // Create service
      createService: async (data) => {
        set({ isLoading: true, error: undefined })

        try {
          const response = await fetch('/api/services', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to create service')
          }

          const newService = await response.json()

          set(state => ({
            services: [...state.services, {
              ...newService,
              createdAt: new Date(newService.createdAt),
              updatedAt: new Date(newService.updatedAt)
            }],
            isLoading: false
          }))

          // Refresh categories
          get().fetchCategories()

          return newService
        } catch (error) {
          console.error('Error creating service:', error)
          set({
            error: error instanceof Error ? error.message : 'Failed to create service',
            isLoading: false
          })
          return null
        }
      },

      // Update service
      updateService: async (id: string, data) => {
        set({ isLoading: true, error: undefined })

        try {
          const response = await fetch(`/api/services/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to update service')
          }

          const updatedService = await response.json()

          set(state => ({
            services: state.services.map(service =>
              service.id === id ? {
                ...updatedService,
                createdAt: new Date(updatedService.createdAt),
                updatedAt: new Date(updatedService.updatedAt)
              } : service
            ),
            selectedService: state.selectedService?.id === id ? {
              ...updatedService,
              createdAt: new Date(updatedService.createdAt),
              updatedAt: new Date(updatedService.updatedAt)
            } : state.selectedService,
            isLoading: false
          }))

          return updatedService
        } catch (error) {
          console.error('Error updating service:', error)
          set({
            error: error instanceof Error ? error.message : 'Failed to update service',
            isLoading: false
          })
          return null
        }
      },

      // Delete service
      deleteService: async (id: string) => {
        set({ isLoading: true, error: undefined })

        try {
          const response = await fetch(`/api/services/${id}`, {
            method: 'DELETE'
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to delete service')
          }

          set(state => ({
            services: state.services.filter(service => service.id !== id),
            selectedService: state.selectedService?.id === id ? undefined : state.selectedService,
            isLoading: false
          }))

          return true
        } catch (error) {
          console.error('Error deleting service:', error)
          set({
            error: error instanceof Error ? error.message : 'Failed to delete service',
            isLoading: false
          })
          return false
        }
      },

      // Toggle service active status
      toggleServiceStatus: async (id: string) => {
        const service = get().services.find(s => s.id === id)
        if (!service) return false

        return await get().updateService(id, { active: !service.active }) !== null
      },

      // Update category
      updateCategory: async (oldCategory: string, newCategory: string, serviceIds?: string[]) => {
        set({ isLoading: true, error: undefined })

        try {
          const response = await fetch('/api/services/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ oldCategory, newCategory, serviceIds })
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to update category')
          }

          // Refresh services and categories
          await Promise.all([
            get().fetchServices(true),
            get().fetchCategories()
          ])

          set({ isLoading: false })
          return true
        } catch (error) {
          console.error('Error updating category:', error)
          set({
            error: error instanceof Error ? error.message : 'Failed to update category',
            isLoading: false
          })
          return false
        }
      },

      // Delete category
      deleteCategory: async (category: string, newCategory: string) => {
        set({ isLoading: true, error: undefined })

        try {
          const response = await fetch('/api/services/categories', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category, newCategory })
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to delete category')
          }

          // Refresh services and categories
          await Promise.all([
            get().fetchServices(true),
            get().fetchCategories()
          ])

          set({ isLoading: false })
          return true
        } catch (error) {
          console.error('Error deleting category:', error)
          set({
            error: error instanceof Error ? error.message : 'Failed to delete category',
            isLoading: false
          })
          return false
        }
      },

      // Set filters
      setFilters: (newFilters) => {
        set(state => ({
          filters: { ...state.filters, ...newFilters }
        }))

        // Auto-fetch with new filters
        get().fetchServices()
      },

      // Clear filters
      clearFilters: () => {
        set({ filters: defaultFilters })
        get().fetchServices()
      },

      // Calculate price
      calculatePrice: (serviceId: string, quantity: number, discount) => {
        const service = get().services.find(s => s.id === serviceId)
        if (!service || quantity <= 0) return null

        const total = service.rate * quantity
        let discountAmount = 0

        if (discount) {
          if (discount.type === 'percentage') {
            discountAmount = total * (discount.value / 100)
          } else {
            discountAmount = discount.value
          }
        }

        return {
          serviceId,
          quantity,
          rate: service.rate,
          total,
          discount: discount ? { ...discount, amount: discountAmount } : undefined,
          finalTotal: total - discountAmount
        }
      },

      // Add calculation
      addCalculation: (calculation) => {
        set(state => ({
          calculations: [
            ...state.calculations.filter(c => c.serviceId !== calculation.serviceId),
            calculation
          ]
        }))
      },

      // Remove calculation
      removeCalculation: (serviceId: string) => {
        set(state => ({
          calculations: state.calculations.filter(c => c.serviceId !== serviceId)
        }))
      },

      // Clear calculations
      clearCalculations: () => {
        set({ calculations: [] })
      },

      // Get total calculation
      getTotalCalculation: () => {
        return get().calculations.reduce((total, calc) => total + calc.finalTotal, 0)
      },

      // Set selected service
      setSelectedService: (service) => {
        set({ selectedService: service })
      },

      // Clear error
      clearError: () => {
        set({ error: undefined })
      }
    }),
    {
      name: 'service-store'
    }
  )
)