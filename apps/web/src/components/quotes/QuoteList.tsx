'use client'

import { useState, useEffect } from 'react'
import { useQuoteStore, Quote, quoteUtils } from '@/stores/quoteStore'
import { useClientStore } from '@/stores/clientStore'
import { useAgentStore } from '@/stores/agentStore'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  PlusIcon,
  AdjustmentsHorizontalIcon,
  ViewColumnsIcon,
  QueueListIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  EyeIcon,
  PencilIcon,
  DocumentDuplicateIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline'
import { QuoteStatus } from '@prisma/client'

interface QuoteListProps {
  onViewQuote?: (quote: Quote) => void
  onEditQuote?: (quote: Quote) => void
  onDuplicateQuote?: (quote: Quote) => void
  onCreateQuote?: () => void
  className?: string
  clientId?: string // Optional filter for specific client
  agentId?: string // Optional filter for specific agent
}

type ViewMode = 'grid' | 'list'

const statusConfig: Record<QuoteStatus, { label: string; color: string; icon: any; bgColor: string }> = {
  DRAFT: {
    label: 'Draft',
    color: 'text-gray-600',
    icon: PencilIcon,
    bgColor: 'bg-gray-100'
  },
  SENT: {
    label: 'Sent',
    color: 'text-blue-600',
    icon: ClockIcon,
    bgColor: 'bg-blue-100'
  },
  PENDING: {
    label: 'Pending',
    color: 'text-yellow-600',
    icon: ClockIcon,
    bgColor: 'bg-yellow-100'
  },
  ACCEPTED: {
    label: 'Accepted',
    color: 'text-green-600',
    icon: CheckCircleIcon,
    bgColor: 'bg-green-100'
  },
  REJECTED: {
    label: 'Rejected',
    color: 'text-red-600',
    icon: XCircleIcon,
    bgColor: 'bg-red-100'
  },
  EXPIRED: {
    label: 'Expired',
    color: 'text-gray-600',
    icon: ArchiveBoxIcon,
    bgColor: 'bg-gray-100'
  }
}

export function QuoteList({
  onViewQuote,
  onEditQuote,
  onDuplicateQuote,
  onCreateQuote,
  className = '',
  clientId,
  agentId
}: QuoteListProps) {
  const {
    quotes,
    isLoading,
    error,
    filters,
    fetchQuotes,
    setFilters,
    clearFilters,
    clearError
  } = useQuoteStore()

  const { clients } = useClientStore()
  const { agents } = useAgentStore()

  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [tempFilters, setTempFilters] = useState(filters)

  // Load data on mount
  useEffect(() => {
    fetchQuotes()
  }, [fetchQuotes])

  // Apply client/agent filters from props
  useEffect(() => {
    if (clientId || agentId) {
      const newFilters = {
        ...filters,
        ...(clientId && { clientId }),
        ...(agentId && { agentId })
      }
      setFilters(newFilters)
      setTempFilters(newFilters)
    }
  }, [clientId, agentId, setFilters])

  // Handle filter changes
  const handleFilterChange = (newFilters: typeof tempFilters) => {
    setTempFilters(newFilters)
  }

  const applyFilters = () => {
    setFilters(tempFilters)
    setShowFilters(false)
  }

  const resetFilters = () => {
    const defaultFilters = {
      search: '',
      status: 'all' as const,
      clientId: clientId || '',
      agentId: agentId || '',
      sortBy: 'createdAt' as const,
      sortOrder: 'desc' as const,
      page: 1,
      limit: 20
    }
    setTempFilters(defaultFilters)
    setFilters(defaultFilters)
    setShowFilters(false)
  }

  // Filter and sort quotes
  const filteredQuotes = quoteUtils.filterQuotes(quotes, filters)
  const sortedQuotes = quoteUtils.sortQuotes(filteredQuotes, filters.sortBy, filters.sortOrder)

  // Get client and agent names for display
  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId)
    return client ? client.name : 'Unknown Client'
  }

  const getAgentName = (agentId?: string) => {
    if (!agentId) return 'Unassigned'
    const agent = agents.find(a => a.id === agentId)
    return agent ? agent.name : 'Unknown Agent'
  }

  // Status filter options
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'SENT', label: 'Sent' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'ACCEPTED', label: 'Accepted' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'EXPIRED', label: 'Expired' }
  ]

  // Format date for display
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Check if quote is actionable
  const isQuoteActionable = (quote: Quote) => {
    return ['DRAFT', 'SENT', 'PENDING'].includes(quote.status)
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg border border-red-200 p-6 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-500 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-red-800">Error loading quotes</h3>
              <p className="text-red-600 mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={() => {
              clearError()
              fetchQuotes(true)
            }}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {clientId ? `Quotes for ${getClientName(clientId)}` :
             agentId ? `Quotes by ${getAgentName(agentId)}` :
             'Quotes'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {isLoading ? 'Loading...' : `${sortedQuotes.length} quote${sortedQuotes.length !== 1 ? 's' : ''}`}
            {filters.search && ` matching "${filters.search}"`}
            {filters.status !== 'all' && ` with status ${statusConfig[filters.status as QuoteStatus]?.label}`}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <div className="border border-gray-300 rounded-lg p-1 flex">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              title="Grid view"
            >
              <ViewColumnsIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              title="List view"
            >
              <QueueListIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors ${
              showFilters ? 'bg-gray-100 text-gray-900' : 'text-gray-600'
            }`}
            title="Filters"
          >
            <FunnelIcon className="h-4 w-4" />
          </button>

          {/* Create Quote */}
          {onCreateQuote && (
            <button
              onClick={onCreateQuote}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              New Quote
            </button>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={tempFilters.search}
                  onChange={(e) => handleFilterChange({ ...tempFilters, search: e.target.value })}
                  placeholder="Search quotes..."
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={tempFilters.status}
                onChange={(e) => handleFilterChange({ ...tempFilters, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Client */}
            {!clientId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                <select
                  value={tempFilters.clientId}
                  onChange={(e) => handleFilterChange({ ...tempFilters, clientId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                >
                  <option value="">All Clients</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Agent */}
            {!agentId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Agent</label>
                <select
                  value={tempFilters.agentId}
                  onChange={(e) => handleFilterChange({ ...tempFilters, agentId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                >
                  <option value="">All Agents</option>
                  {agents.map(agent => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <div className="flex space-x-2">
                <select
                  value={tempFilters.sortBy}
                  onChange={(e) => handleFilterChange({ ...tempFilters, sortBy: e.target.value as any })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                >
                  <option value="createdAt">Created</option>
                  <option value="updatedAt">Updated</option>
                  <option value="number">Number</option>
                  <option value="totalAmount">Amount</option>
                  <option value="validUntil">Valid Until</option>
                </select>
                <select
                  value={tempFilters.sortOrder}
                  onChange={(e) => handleFilterChange({ ...tempFilters, sortOrder: e.target.value as 'asc' | 'desc' })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                >
                  <option value="desc">↓</option>
                  <option value="asc">↑</option>
                </select>
              </div>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-600">
              <AdjustmentsHorizontalIcon className="h-4 w-4 mr-1" />
              {sortedQuotes.length} result{sortedQuotes.length !== 1 ? 's' : ''}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={resetFilters}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={applyFilters}
                className="px-4 py-2 bg-slate-600 text-white text-sm rounded-md hover:bg-slate-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <ArrowPathIcon className="h-8 w-8 text-gray-400 animate-spin mr-3" />
          <span className="text-gray-600">Loading quotes...</span>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && sortedQuotes.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No quotes found</h3>
          <p className="text-gray-600 mb-4">
            {filters.search || filters.status !== 'all' || filters.clientId || filters.agentId
              ? 'Try adjusting your filters to find more quotes.'
              : 'Get started by creating your first quote.'}
          </p>
          {onCreateQuote && (
            <button
              onClick={onCreateQuote}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors inline-flex items-center"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              New Quote
            </button>
          )}
        </div>
      )}

      {/* Quotes Grid/List */}
      {!isLoading && sortedQuotes.length > 0 && (
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'space-y-4'
        }>
          {sortedQuotes.map(quote => {
            const status = statusConfig[quote.status]
            const StatusIcon = status.icon
            const isActionable = isQuoteActionable(quote)

            return (
              <div
                key={quote.id}
                className={`bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow ${
                  viewMode === 'list' ? 'p-4' : 'p-6'
                }`}
              >
                {/* Quote Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">{quote.number}</h3>
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{getClientName(quote.clientId)}</p>
                    {quote.agentId && (
                      <p className="text-xs text-gray-500">Agent: {getAgentName(quote.agentId)}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1">
                    {onViewQuote && (
                      <button
                        onClick={() => onViewQuote(quote)}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                        title="View quote"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                    )}
                    {onEditQuote && isActionable && (
                      <button
                        onClick={() => onEditQuote(quote)}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                        title="Edit quote"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    )}
                    {onDuplicateQuote && (
                      <button
                        onClick={() => onDuplicateQuote(quote)}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                        title="Duplicate quote"
                      >
                        <DocumentDuplicateIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Quote Details */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Total Amount</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {quoteUtils.formatAmount(quote.totalAmount)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Created</span>
                    <span className="text-gray-700">{formatDate(quote.createdAt)}</span>
                  </div>

                  {quote.validUntil && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Valid Until</span>
                      <span className={`text-gray-700 ${new Date(quote.validUntil) < new Date() ? 'text-red-600' : ''}`}>
                        {formatDate(quote.validUntil)}
                      </span>
                    </div>
                  )}

                  {quote.notes && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 line-clamp-2">{quote.notes}</p>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                {viewMode === 'grid' && (
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {quote.items?.length || 0} item{(quote.items?.length || 0) !== 1 ? 's' : ''}
                    </span>
                    {onViewQuote && (
                      <button
                        onClick={() => onViewQuote(quote)}
                        className="text-xs text-slate-600 hover:text-slate-800 font-medium"
                      >
                        View Details →
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}