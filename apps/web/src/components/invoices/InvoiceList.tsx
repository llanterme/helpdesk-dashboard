'use client'

import { useState, useEffect } from 'react'
import { useInvoiceStore, Invoice, invoiceUtils } from '@/stores/invoiceStore'
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
  TrashIcon,
  ClockIcon,
  CheckCircleIcon,
  BanknotesIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'

interface InvoiceListProps {
  onViewInvoice?: (invoice: Invoice) => void
  onEditInvoice?: (invoice: Invoice) => void
  onDeleteInvoice?: (invoice: Invoice) => void
  onCreateInvoice?: () => void
}

export function InvoiceList({
  onViewInvoice,
  onEditInvoice,
  onDeleteInvoice,
  onCreateInvoice
}: InvoiceListProps) {
  const {
    invoices,
    isLoading,
    error,
    filters,
    pagination,
    fetchInvoices,
    setFilters,
    setPagination,
    updateInvoiceStatus,
    deleteInvoice,
    clearError
  } = useInvoiceStore()

  const { clients } = useClientStore()
  const { agents } = useAgentStore()

  const [showFilters, setShowFilters] = useState(false)
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState('')

  // Load invoices on component mount and when filters change
  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices, filters, pagination.page])

  // Clear error when component mounts
  useEffect(() => {
    return () => clearError()
  }, [clearError])

  // Apply filters and sorting
  const filteredInvoices = invoiceUtils.filterInvoices(invoices, filters)
  const sortedInvoices = invoiceUtils.sortInvoices(filteredInvoices, filters.sortBy, filters.sortOrder)

  // Get client and agent names for display
  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId)
    return client ? client.name : 'Unknown Client'
  }

  const getAgentName = (agentId?: string) => {
    if (!agentId) return 'No Agent'
    const agent = agents.find(a => a.id === agentId)
    return agent ? agent.name : 'Unknown Agent'
  }

  // Handle search
  const handleSearch = (value: string) => {
    setFilters({ search: value })
  }

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilters({ [key]: value })
  }

  // Handle sort changes
  const handleSort = (field: string) => {
    const newOrder = filters.sortBy === field && filters.sortOrder === 'desc' ? 'asc' : 'desc'
    setFilters({ sortBy: field, sortOrder: newOrder })
  }

  // Handle pagination
  const handlePageChange = (page: number) => {
    setPagination({ page })
  }

  // Handle invoice actions
  const handleMarkPaid = async (invoice: Invoice) => {
    try {
      await updateInvoiceStatus(invoice.id, 'PAID', new Date().toISOString())
    } catch (error) {
      console.error('Error marking invoice as paid:', error)
    }
  }

  const handleMarkSent = async (invoice: Invoice) => {
    try {
      await updateInvoiceStatus(invoice.id, 'SENT')
    } catch (error) {
      console.error('Error marking invoice as sent:', error)
    }
  }

  const handleDeleteInvoice = async (invoice: Invoice) => {
    if (window.confirm(`Are you sure you want to delete invoice ${invoiceUtils.formatInvoiceNumber(invoice.id)}?`)) {
      try {
        await deleteInvoice(invoice.id)
        if (onDeleteInvoice) onDeleteInvoice(invoice)
      } catch (error) {
        console.error('Error deleting invoice:', error)
      }
    }
  }

  // Handle bulk actions
  const handleBulkAction = async () => {
    if (!bulkAction || selectedInvoices.length === 0) return

    try {
      for (const invoiceId of selectedInvoices) {
        if (bulkAction === 'mark-sent') {
          await updateInvoiceStatus(invoiceId, 'SENT')
        } else if (bulkAction === 'mark-paid') {
          await updateInvoiceStatus(invoiceId, 'PAID', new Date().toISOString())
        }
      }
      setSelectedInvoices([])
      setBulkAction('')
    } catch (error) {
      console.error('Error performing bulk action:', error)
    }
  }

  // Calculate overdue invoices
  const overdueCount = invoices.filter(invoice => invoiceUtils.isOverdue(invoice)).length

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">Error loading invoices</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => fetchInvoices()}
            className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Overdue Alert */}
          {overdueCount > 0 && (
            <div className="flex items-center px-3 py-2 bg-red-100 text-red-800 rounded-lg text-sm">
              <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
              {overdueCount} Overdue
            </div>
          )}

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2 rounded-lg border transition-colors flex items-center ${
              showFilters
                ? 'bg-slate-100 border-slate-300 text-slate-700'
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filters
          </button>

          {/* View Options */}
          <div className="flex rounded-lg border border-gray-300 bg-white">
            <button className="px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-l-lg">
              <QueueListIcon className="h-4 w-4" />
            </button>
            <button className="px-3 py-2 text-gray-400 hover:bg-gray-50 rounded-r-lg">
              <ViewColumnsIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Create Invoice */}
          <button
            onClick={onCreateInvoice}
            className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            New Invoice
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              >
                <option value="all">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="SENT">Sent</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Agent</label>
              <select
                value={filters.agentId}
                onChange={(e) => handleFilterChange('agentId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              >
                <option value="all">All Agents</option>
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id}>{agent.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
              <select
                value={filters.clientId}
                onChange={(e) => handleFilterChange('clientId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              >
                <option value="all">All Clients</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name} {client.company && `(${client.company})`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              >
                <option value="createdAt">Created Date</option>
                <option value="dueDate">Due Date</option>
                <option value="totalAmount">Amount</option>
                <option value="status">Status</option>
                <option value="client">Client</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button
              onClick={() => {
                setFilters({
                  search: '',
                  status: 'all',
                  agentId: 'all',
                  clientId: 'all',
                  sortBy: 'createdAt',
                  sortOrder: 'desc'
                })
                setShowFilters(false)
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedInvoices.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <span className="text-sm font-medium text-slate-700">
            {selectedInvoices.length} invoice{selectedInvoices.length !== 1 ? 's' : ''} selected
          </span>
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
          >
            <option value="">Choose action...</option>
            <option value="mark-sent">Mark as Sent</option>
            <option value="mark-paid">Mark as Paid</option>
          </select>
          <button
            onClick={handleBulkAction}
            disabled={!bulkAction}
            className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Apply
          </button>
          <button
            onClick={() => setSelectedInvoices([])}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Clear Selection
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <ArrowPathIcon className="h-6 w-6 text-gray-400 animate-spin mr-3" />
          <span className="text-gray-600">Loading invoices...</span>
        </div>
      )}

      {/* Invoice List */}
      {!isLoading && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedInvoices(sortedInvoices.map(i => i.id))
                        } else {
                          setSelectedInvoices([])
                        }
                      }}
                      className="rounded border-gray-300 text-slate-600 focus:ring-slate-500"
                    />
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('id')}
                  >
                    Invoice #
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('client')}
                  >
                    Client
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('totalAmount')}
                  >
                    Amount
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('status')}
                  >
                    Status
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('dueDate')}
                  >
                    Due Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedInvoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedInvoices.includes(invoice.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedInvoices([...selectedInvoices, invoice.id])
                          } else {
                            setSelectedInvoices(selectedInvoices.filter(id => id !== invoice.id))
                          }
                        }}
                        className="rounded border-gray-300 text-slate-600 focus:ring-slate-500"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">
                          {invoiceUtils.formatInvoiceNumber(invoice.id)}
                        </span>
                        {invoice.quote && (
                          <span className="ml-2 text-xs text-gray-500">
                            from {invoice.quote.number}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {getClientName(invoice.clientId)}
                        </div>
                        {invoice.client?.company && (
                          <div className="text-sm text-gray-500">{invoice.client.company}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {invoiceUtils.formatAmount(invoice.totalAmount)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${invoiceUtils.getStatusColor(invoice.status)}20`,
                          color: invoiceUtils.getStatusColor(invoice.status)
                        }}
                      >
                        {invoice.status === 'PAID' && <CheckCircleIcon className="h-3 w-3 mr-1" />}
                        {invoice.status === 'OVERDUE' && <ClockIcon className="h-3 w-3 mr-1" />}
                        {invoiceUtils.formatStatus(invoice.status)}
                      </span>
                      {invoiceUtils.isOverdue(invoice) && (
                        <div className="text-xs text-red-600 mt-1">
                          {invoiceUtils.getDaysPastDue(invoice)} days overdue
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {invoice.dueDate
                        ? new Date(invoice.dueDate).toLocaleDateString()
                        : 'No due date'
                      }
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onViewInvoice?.(invoice)}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                          title="View invoice"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>

                        {invoiceUtils.canEdit(invoice) && (
                          <button
                            onClick={() => onEditInvoice?.(invoice)}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Edit invoice"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                        )}

                        {invoiceUtils.canMarkPaid(invoice) && (
                          <button
                            onClick={() => handleMarkPaid(invoice)}
                            className="p-1 text-green-400 hover:text-green-600 transition-colors"
                            title="Mark as paid"
                          >
                            <BanknotesIcon className="h-4 w-4" />
                          </button>
                        )}

                        {invoice.status === 'PENDING' && (
                          <button
                            onClick={() => handleMarkSent(invoice)}
                            className="p-1 text-blue-400 hover:text-blue-600 transition-colors"
                            title="Mark as sent"
                          >
                            <CurrencyDollarIcon className="h-4 w-4" />
                          </button>
                        )}

                        {invoiceUtils.canDelete(invoice) && (
                          <button
                            onClick={() => handleDeleteInvoice(invoice)}
                            className="p-1 text-red-400 hover:text-red-600 transition-colors"
                            title="Delete invoice"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {sortedInvoices.length === 0 && !isLoading && (
            <div className="text-center py-8">
              <CurrencyDollarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">No invoices found</p>
              <p className="text-gray-600 mb-4">
                {filters.search || filters.status !== 'all' || filters.agentId !== 'all' || filters.clientId !== 'all'
                  ? 'Try adjusting your filters to find more invoices.'
                  : 'Create your first invoice to get started.'
                }
              </p>
              {onCreateInvoice && (
                <button
                  onClick={onCreateInvoice}
                  className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Create Invoice
                </button>
              )}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{' '}
                {pagination.totalCount} invoices
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPreviousPage}
                  className="px-3 py-1 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="px-3 py-1 bg-slate-100 text-slate-800 rounded">
                  {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNextPage}
                  className="px-3 py-1 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}