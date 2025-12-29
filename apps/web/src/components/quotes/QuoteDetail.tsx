'use client'

import { useState, useEffect } from 'react'
import { useQuoteStore, Quote, quoteUtils } from '@/stores/quoteStore'
import { useClientStore } from '@/stores/clientStore'
import { useAgentStore } from '@/stores/agentStore'
import { useServiceStore } from '@/stores/serviceStore'
import {
  ArrowLeftIcon,
  PencilIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  PrinterIcon,
  ShareIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ClockIcon,
  CalendarIcon,
  UserIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  EnvelopeIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  TagIcon,
  BanknotesIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline'
import { QuoteStatus } from '@prisma/client'

interface QuoteDetailProps {
  quoteId: string
  onBack?: () => void
  onEdit?: (quote: Quote) => void
  onDuplicate?: (quote: Quote) => void
  onConvert?: (quote: Quote) => void
  className?: string
}

const statusConfig: Record<QuoteStatus, { label: string; color: string; icon: any; bgColor: string; description: string }> = {
  DRAFT: {
    label: 'Draft',
    color: 'text-gray-600',
    icon: PencilIcon,
    bgColor: 'bg-gray-100',
    description: 'Quote is being prepared and has not been sent to the client'
  },
  SENT: {
    label: 'Sent',
    color: 'text-blue-600',
    icon: PaperAirplaneIcon,
    bgColor: 'bg-blue-100',
    description: 'Quote has been sent to the client and is awaiting review'
  },
  PENDING: {
    label: 'Pending',
    color: 'text-yellow-600',
    icon: ClockIcon,
    bgColor: 'bg-yellow-100',
    description: 'Client has received the quote and it is under review'
  },
  ACCEPTED: {
    label: 'Accepted',
    color: 'text-green-600',
    icon: CheckCircleIcon,
    bgColor: 'bg-green-100',
    description: 'Client has accepted the quote and it can be converted to an invoice'
  },
  REJECTED: {
    label: 'Rejected',
    color: 'text-red-600',
    icon: XCircleIcon,
    bgColor: 'bg-red-100',
    description: 'Client has rejected the quote'
  },
  EXPIRED: {
    label: 'Expired',
    color: 'text-gray-600',
    icon: ArchiveBoxIcon,
    bgColor: 'bg-gray-100',
    description: 'Quote has expired and is no longer valid'
  }
}

export function QuoteDetail({
  quoteId,
  onBack,
  onEdit,
  onDuplicate,
  onConvert,
  className = ''
}: QuoteDetailProps) {
  const {
    quotes,
    isLoading,
    error,
    updateQuoteStatus,
    deleteQuote,
    fetchQuotes,
    clearError
  } = useQuoteStore()

  const { clients } = useClientStore()
  const { agents } = useAgentStore()
  const { services } = useServiceStore()

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Load data on mount
  useEffect(() => {
    if (!quotes.length) fetchQuotes()
  }, [quoteId, fetchQuotes])

  // Find the quote
  const quote = quotes.find(q => q.id === quoteId)

  // Get related data
  const client = quote ? clients.find(c => c.id === quote.clientId) : null
  const agent = quote?.agentId ? agents.find(a => a.id === quote.agentId) : null

  // Get services for quote items
  const getServiceForItem = (serviceId: string) => {
    return services.find(s => s.id === serviceId)
  }

  // Handle status updates
  const handleStatusUpdate = async (newStatus: QuoteStatus, notes?: string) => {
    if (!quote) return

    setIsUpdatingStatus(true)
    try {
      await updateQuoteStatus(quote.id, newStatus, notes)
    } catch (error) {
      console.error('Failed to update quote status:', error)
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  // Handle quote deletion
  const handleDelete = async () => {
    if (!quote) return

    setIsDeleting(true)
    try {
      await deleteQuote(quote.id)
      onBack?.()
    } catch (error) {
      console.error('Failed to delete quote:', error)
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  // Format date for display
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDateShort = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Check if quote is actionable
  const isQuoteActionable = (status: QuoteStatus) => {
    return ['DRAFT', 'SENT', 'PENDING'].includes(status)
  }

  // Check if status transition is valid
  const getValidStatusTransitions = (currentStatus: QuoteStatus): QuoteStatus[] => {
    switch (currentStatus) {
      case 'DRAFT':
        return ['SENT']
      case 'SENT':
        return ['PENDING', 'REJECTED']
      case 'PENDING':
        return ['ACCEPTED', 'REJECTED', 'EXPIRED']
      case 'ACCEPTED':
        return [] // Terminal state (can only convert to invoice)
      case 'REJECTED':
        return [] // Terminal state
      case 'EXPIRED':
        return [] // Terminal state
      default:
        return []
    }
  }

  if (isLoading && !quote) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <ArrowPathIcon className="h-8 w-8 text-gray-400 animate-spin mr-3" />
        <span className="text-gray-600">Loading quote...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg border border-red-200 p-6 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-500 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-red-800">Error loading quote</h3>
              <p className="text-red-600 mt-1">{error}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            {onBack && (
              <button
                onClick={onBack}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Go Back
              </button>
            )}
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
      </div>
    )
  }

  if (!quote) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 text-center ${className}`}>
        <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Quote not found</h3>
        <p className="text-gray-600 mb-4">The quote you're looking for could not be found.</p>
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors"
          >
            Go Back
          </button>
        )}
      </div>
    )
  }

  const status = statusConfig[quote.status]
  const StatusIcon = status.icon
  const validTransitions = getValidStatusTransitions(quote.status)

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
            )}

            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{quote.number}</h1>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${status.bgColor} ${status.color}`}>
                  <StatusIcon className="h-4 w-4 mr-1" />
                  {status.label}
                </div>
              </div>
              <p className="text-gray-600 mb-1">{status.description}</p>
              <p className="text-sm text-gray-500">
                Created {formatDate(quote.createdAt)}
                {quote.updatedAt !== quote.createdAt && ` • Updated ${formatDate(quote.updatedAt)}`}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {isQuoteActionable(quote.status) && onEdit && (
              <button
                onClick={() => onEdit(quote)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit
              </button>
            )}

            {onDuplicate && (
              <button
                onClick={() => onDuplicate(quote)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
              >
                <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
                Duplicate
              </button>
            )}

            {quote.status === 'ACCEPTED' && onConvert && (
              <button
                onClick={() => onConvert(quote)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <BanknotesIcon className="h-4 w-4 mr-2" />
                Convert to Invoice
              </button>
            )}

            <button
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
            >
              <PrinterIcon className="h-4 w-4 mr-2" />
              Print
            </button>

            <button
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
            >
              <ShareIcon className="h-4 w-4 mr-2" />
              Share
            </button>

            {isQuoteActionable(quote.status) && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quote Items */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                Quote Items ({quote.items?.length || 0})
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {quote.items?.map((item, index) => {
                    const service = getServiceForItem(item.serviceId)
                    return (
                      <tr key={item.id || index} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {service?.name || 'Unknown Service'}
                            </div>
                            {service?.description && (
                              <div className="text-sm text-gray-500 line-clamp-2 mt-1">
                                {service.description}
                              </div>
                            )}
                            {item.customDescription && (
                              <div className="text-xs text-blue-600 mt-1 italic">
                                Note: {item.customDescription}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-gray-900">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-gray-900">
                          {quoteUtils.formatAmount(item.rate)} {service?.unit && `per ${service.unit.replace('per ', '')}`}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                          {quoteUtils.formatAmount(item.lineTotal)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Quote Totals */}
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">{quoteUtils.formatAmount(quote.subtotal)}</span>
                </div>

                {quote.discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount ({quote.discountRate}%)</span>
                    <span className="text-red-600">-{quoteUtils.formatAmount(quote.discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">VAT ({quote.taxRate}%)</span>
                  <span className="text-gray-900">{quoteUtils.formatAmount(quote.taxAmount)}</span>
                </div>

                <div className="border-t border-gray-300 pt-2 flex justify-between">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-lg font-semibold text-gray-900">{quoteUtils.formatAmount(quote.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes & Terms */}
          {(quote.notes || quote.terms) && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              {quote.notes && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes</h3>
                  <div className="text-gray-700 whitespace-pre-wrap">{quote.notes}</div>
                </div>
              )}

              {quote.terms && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Terms & Conditions</h3>
                  <div className="text-gray-700 whitespace-pre-wrap">{quote.terms}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client Information */}
          {client && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <UserIcon className="h-5 w-5 mr-2" />
                Client Information
              </h3>

              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-gray-900">{client.name}</div>
                  {client.company && (
                    <div className="text-sm text-gray-600 flex items-center mt-1">
                      <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                      {client.company}
                    </div>
                  )}
                </div>

                {client.email && (
                  <div className="text-sm text-gray-600 flex items-center">
                    <EnvelopeIcon className="h-4 w-4 mr-2" />
                    {client.email}
                  </div>
                )}

                {client.phone && (
                  <div className="text-sm text-gray-600 flex items-center">
                    <PhoneIcon className="h-4 w-4 mr-2" />
                    {client.phone}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Agent Information */}
          {agent && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <UserIcon className="h-5 w-5 mr-2" />
                Assigned Agent
              </h3>

              <div className="flex items-center space-x-3">
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-medium"
                  style={{ backgroundColor: agent.color || '#6B7280' }}
                >
                  {agent.avatar ? (
                    <img src={agent.avatar} alt={agent.name} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    agent.name.split(' ').map(n => n[0]).join('').toUpperCase()
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{agent.name}</div>
                  <div className="text-sm text-gray-600">{agent.email}</div>
                </div>
              </div>
            </div>
          )}

          {/* Quote Details */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              Quote Details
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Quote Number</span>
                <span className="font-medium text-gray-900">{quote.number}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Created</span>
                <span className="text-gray-900">{formatDateShort(quote.createdAt)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated</span>
                <span className="text-gray-900">{formatDateShort(quote.updatedAt)}</span>
              </div>

              {quote.validUntil && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Valid Until</span>
                  <span className={`text-gray-900 ${new Date(quote.validUntil) < new Date() ? 'text-red-600' : ''}`}>
                    {formatDateShort(quote.validUntil)}
                  </span>
                </div>
              )}

              {quote.sentAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Sent At</span>
                  <span className="text-gray-900">{formatDateShort(quote.sentAt)}</span>
                </div>
              )}

              {quote.acceptedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Accepted At</span>
                  <span className="text-green-600">{formatDateShort(quote.acceptedAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Status Actions */}
          {validTransitions.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <TagIcon className="h-5 w-5 mr-2" />
                Update Status
              </h3>

              <div className="space-y-2">
                {validTransitions.map(newStatus => {
                  const newStatusConfig = statusConfig[newStatus]
                  const NewStatusIcon = newStatusConfig.icon

                  return (
                    <button
                      key={newStatus}
                      onClick={() => handleStatusUpdate(newStatus)}
                      disabled={isUpdatingStatus}
                      className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <div className="flex items-center">
                        <NewStatusIcon className={`h-4 w-4 mr-2 ${newStatusConfig.color}`} />
                        <span className="text-sm font-medium">Mark as {newStatusConfig.label}</span>
                      </div>
                      {isUpdatingStatus && (
                        <ArrowPathIcon className="h-4 w-4 animate-spin text-gray-400" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-500 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Delete Quote</h3>
              </div>

              <p className="text-gray-600 mb-6">
                Are you sure you want to delete quote {quote.number}? This action cannot be undone.
              </p>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {isDeleting ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <TrashIcon className="h-4 w-4 mr-2" />
                      Delete Quote
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}