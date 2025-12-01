'use client'

import { create } from 'zustand'
import { Agent, AgentRole, AgentStatus } from '@helpdesk/database'

// Extended agent interface with computed statistics
export interface AgentWithStats extends Agent {
  activeTickets: number
  totalTickets: number
  totalQuotes: number
  totalInvoices: number
  ticketStats: Record<string, number>
  performanceMetrics?: {
    totalTickets: number
    resolvedTickets: number
    resolutionRate: number
    recentTickets: number
    avgResponseTime: number
  }
  recentActivity?: Array<{
    id: string
    subject: string
    clientName: string
    status: string
    updatedAt: Date | string
  }>
}

// Activity item interface for agent activity timeline
export interface ActivityItem {
  id: string
  type: 'ticket' | 'quote' | 'invoice'
  action: string
  description: string
  timestamp: Date | string
  metadata?: Record<string, any>
}

// Agent filters interface
export interface AgentFilters {
  search: string
  role: string
  status: string
  sortBy: 'name' | 'created' | 'tickets' | 'performance'
  sortOrder: 'asc' | 'desc'
}

// Pagination interface
export interface AgentPagination {
  page: number
  limit: number
  total: number
  pages: number
}

// Agent summary statistics
export interface AgentSummary {
  total: number
  activeAgents: number
  totalActiveTickets: number
  byRole: Record<string, number>
  byStatus: Record<string, number>
}

// Agent store interface
interface AgentStore {
  // State
  agents: AgentWithStats[]
  selectedAgent: AgentWithStats | null
  filters: AgentFilters
  pagination: AgentPagination
  summary: AgentSummary | null
  loading: boolean
  error: string | null

  // Actions - Agent Management
  setAgents: (agents: AgentWithStats[], pagination?: Partial<AgentPagination>) => void
  addAgent: (agent: AgentWithStats) => void
  updateAgent: (id: string, agent: Partial<AgentWithStats>) => void
  removeAgent: (id: string) => void
  setSelectedAgent: (agent: AgentWithStats | null) => void

  // Actions - Filtering & Pagination
  setFilters: (filters: Partial<AgentFilters>) => void
  clearFilters: () => void
  setPagination: (pagination: Partial<AgentPagination>) => void

  // Actions - UI State
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setSummary: (summary: AgentSummary) => void

  // Computed Values
  getFilteredAgents: () => AgentWithStats[]
  getAgentStats: () => {
    total: number
    activeAgents: number
    averageTickets: number
    topPerformers: AgentWithStats[]
  }
  getAgentById: (id: string) => AgentWithStats | undefined
  hasActiveFilters: () => boolean
}

const defaultFilters: AgentFilters = {
  search: '',
  role: '',
  status: '',
  sortBy: 'name',
  sortOrder: 'asc'
}

const defaultPagination: AgentPagination = {
  page: 1,
  limit: 20,
  total: 0,
  pages: 0
}

export const useAgentStore = create<AgentStore>((set, get) => ({
  // Initial State
  agents: [],
  selectedAgent: null,
  filters: defaultFilters,
  pagination: defaultPagination,
  summary: null,
  loading: false,
  error: null,

  // Agent Management Actions
  setAgents: (agents, paginationUpdate) => {
    set((state) => ({
      agents,
      pagination: paginationUpdate ? { ...state.pagination, ...paginationUpdate } : state.pagination
    }))
  },

  addAgent: (agent) => {
    set((state) => ({
      agents: [agent, ...state.agents],
      pagination: {
        ...state.pagination,
        total: state.pagination.total + 1
      }
    }))
  },

  updateAgent: (id, updatedAgent) => {
    set((state) => ({
      agents: state.agents.map(agent =>
        agent.id === id ? { ...agent, ...updatedAgent } : agent
      ),
      selectedAgent: state.selectedAgent?.id === id
        ? { ...state.selectedAgent, ...updatedAgent }
        : state.selectedAgent
    }))
  },

  removeAgent: (id) => {
    set((state) => ({
      agents: state.agents.filter(agent => agent.id !== id),
      selectedAgent: state.selectedAgent?.id === id ? null : state.selectedAgent,
      pagination: {
        ...state.pagination,
        total: Math.max(0, state.pagination.total - 1)
      }
    }))
  },

  setSelectedAgent: (agent) => {
    set({ selectedAgent: agent })
  },

  // Filtering & Pagination Actions
  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
      // Reset to first page when filters change
      pagination: { ...state.pagination, page: 1 }
    }))
  },

  clearFilters: () => {
    set({
      filters: defaultFilters,
      pagination: { ...defaultPagination, limit: get().pagination.limit }
    })
  },

  setPagination: (paginationUpdate) => {
    set((state) => ({
      pagination: { ...state.pagination, ...paginationUpdate }
    }))
  },

  // UI State Actions
  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  setSummary: (summary) => set({ summary }),

  // Computed Values
  getFilteredAgents: () => {
    const { agents, filters } = get()
    let filtered = [...agents]

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(agent =>
        agent.name.toLowerCase().includes(searchTerm) ||
        agent.email.toLowerCase().includes(searchTerm)
      )
    }

    // Apply role filter
    if (filters.role && filters.role !== 'all') {
      filtered = filtered.filter(agent =>
        agent.role.toLowerCase() === filters.role.toLowerCase()
      )
    }

    // Apply status filter
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(agent =>
        agent.status.toLowerCase() === filters.status.toLowerCase()
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (filters.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'created':
          aValue = new Date(a.createdAt)
          bValue = new Date(b.createdAt)
          break
        case 'tickets':
          aValue = a.totalTickets
          bValue = b.totalTickets
          break
        case 'performance':
          aValue = a.performanceMetrics?.resolutionRate || 0
          bValue = b.performanceMetrics?.resolutionRate || 0
          break
        default:
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
      }

      if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  },

  getAgentStats: () => {
    const { agents } = get()
    const total = agents.length
    const activeAgents = agents.filter(agent => agent.status === 'ACTIVE').length

    const totalTickets = agents.reduce((sum, agent) => sum + agent.totalTickets, 0)
    const averageTickets = total > 0 ? Math.round((totalTickets / total) * 100) / 100 : 0

    // Top performers by resolution rate
    const topPerformers = agents
      .filter(agent => agent.performanceMetrics && agent.totalTickets > 0)
      .sort((a, b) => (b.performanceMetrics?.resolutionRate || 0) - (a.performanceMetrics?.resolutionRate || 0))
      .slice(0, 5)

    return {
      total,
      activeAgents,
      averageTickets,
      topPerformers
    }
  },

  getAgentById: (id) => {
    return get().agents.find(agent => agent.id === id)
  },

  hasActiveFilters: () => {
    const { filters } = get()
    return !!(
      filters.search ||
      (filters.role && filters.role !== 'all') ||
      (filters.status && filters.status !== 'all')
    )
  }
}))

// Utility functions for agent management
export const agentUtils = {
  // Get role display name
  getRoleDisplayName: (role: AgentRole): string => {
    const roleNames = {
      ADMIN: 'Administrator',
      SENIOR_AGENT: 'Senior Agent',
      AGENT: 'Agent'
    }
    return roleNames[role] || role
  },

  // Get role color for UI
  getRoleColor: (role: AgentRole): string => {
    const colors = {
      ADMIN: 'red',
      SENIOR_AGENT: 'blue',
      AGENT: 'green'
    }
    return colors[role] || 'gray'
  },

  // Get status display name
  getStatusDisplayName: (status: AgentStatus): string => {
    return status.toLowerCase().replace('_', ' ')
  },

  // Get status color for UI
  getStatusColor: (status: AgentStatus): string => {
    const colors = {
      ACTIVE: 'green',
      INACTIVE: 'gray'
    }
    return colors[status] || 'gray'
  },

  // Format commission rate
  formatCommissionRate: (rate: number): string => {
    return `${rate}%`
  },

  // Calculate performance grade
  getPerformanceGrade: (resolutionRate: number): { grade: string; color: string } => {
    if (resolutionRate >= 90) return { grade: 'A+', color: 'green' }
    if (resolutionRate >= 80) return { grade: 'A', color: 'green' }
    if (resolutionRate >= 70) return { grade: 'B+', color: 'blue' }
    if (resolutionRate >= 60) return { grade: 'B', color: 'blue' }
    if (resolutionRate >= 50) return { grade: 'C+', color: 'yellow' }
    if (resolutionRate >= 40) return { grade: 'C', color: 'yellow' }
    return { grade: 'D', color: 'red' }
  },

  // Check if agent can be deleted
  canDeleteAgent: (agent: AgentWithStats): boolean => {
    return agent.totalTickets === 0 && agent.totalQuotes === 0 && agent.totalInvoices === 0
  },

  // Get available roles for selection
  getAvailableRoles: (): Array<{ value: AgentRole; label: string }> => [
    { value: 'AGENT', label: 'Agent' },
    { value: 'SENIOR_AGENT', label: 'Senior Agent' },
    { value: 'ADMIN', label: 'Administrator' }
  ],

  // Get available statuses for selection
  getAvailableStatuses: (): Array<{ value: AgentStatus; label: string }> => [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' }
  ]
}