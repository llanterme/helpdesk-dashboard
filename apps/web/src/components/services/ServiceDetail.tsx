'use client'

import { useState, useEffect } from 'react'
import { useServiceStore, Service, serviceUtils } from '@/stores/serviceStore'
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  TagIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

interface ServiceDetailProps {
  serviceId: string
  onBack?: () => void
  onEdit?: (service: Service) => void
  onDelete?: (service: Service) => void
  className?: string
}

export function ServiceDetail({
  serviceId,
  onBack,
  onEdit,
  onDelete,
  className = ''
}: ServiceDetailProps) {
  const {
    selectedService,
    isLoading,
    error,
    fetchService,
    toggleServiceStatus,
    clearError
  } = useServiceStore()

  const [isToggling, setIsToggling] = useState(false)

  // Fetch service details on mount
  useEffect(() => {
    fetchService(serviceId)
  }, [serviceId, fetchService])

  const handleToggleStatus = async () => {
    if (!selectedService) return

    setIsToggling(true)
    try {
      await toggleServiceStatus(selectedService.id)
      // Refresh service details
      await fetchService(serviceId)
    } finally {
      setIsToggling(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow ${className}`}>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <ArrowPathIcon className="h-8 w-8 text-gray-400 animate-spin mr-3" />
            <span className="text-gray-600">Loading service details...</span>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow border border-red-200 ${className}`}>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-500 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-red-800">Error loading service</h3>
                <p className="text-red-600 mt-1">{error}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {onBack && (
                <button
                  onClick={onBack}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Go Back
                </button>
              )}
              <button
                onClick={() => {
                  clearError()
                  fetchService(serviceId)
                }}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // No service found
  if (!selectedService) {
    return (
      <div className={`bg-white rounded-lg shadow ${className}`}>
        <div className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Service not found</h3>
            <p className="text-gray-600 mb-4">The requested service could not be found.</p>
            {onBack && (
              <button
                onClick={onBack}
                className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors"
              >
                Go Back
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const service = selectedService
  const categoryColor = serviceUtils.getCategoryColor(service.category)
  const totalUsage = (service._count?.quoteItems || 0) + (service._count?.invoiceItems || 0)

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {onBack && (
              <button
                onClick={onBack}
                className="mr-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Go back"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
            )}

            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-semibold text-gray-900">{service.name}</h1>
                {service.active ? (
                  <CheckCircleIcon className="h-6 w-6 text-green-500" title="Active" />
                ) : (
                  <XCircleIcon className="h-6 w-6 text-red-500" title="Inactive" />
                )}
              </div>

              <div className="flex items-center gap-3">
                <span
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: `${categoryColor}15`,
                    color: categoryColor,
                    border: `1px solid ${categoryColor}30`
                  }}
                >
                  <TagIcon className="w-4 h-4 mr-1" />
                  {service.category}
                </span>

                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                  {serviceUtils.formatSku(service.sku)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handleToggleStatus}
              disabled={isToggling}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                service.active
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              } disabled:opacity-50`}
            >
              {isToggling ? 'Updating...' : service.active ? 'Deactivate' : 'Activate'}
            </button>

            {onEdit && (
              <button
                onClick={() => onEdit(service)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit
              </button>
            )}

            {onDelete && (
              <button
                onClick={() => onDelete(service)}
                className="px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 flex items-center"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {service.description && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  Description
                </h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{service.description}</p>
                </div>
              </div>
            )}

            {/* Pricing Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <CurrencyDollarIcon className="h-5 w-5 mr-2" />
                Pricing
              </h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Rate</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {serviceUtils.formatRate(service.rate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Unit</p>
                    <p className="text-lg text-gray-900 capitalize">{service.unit}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Usage Statistics */}
            {totalUsage > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                  <ChartBarIcon className="h-5 w-5 mr-2" />
                  Usage Statistics
                </h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-semibold text-gray-900">{totalUsage}</p>
                      <p className="text-sm text-gray-600">Total Usage</p>
                    </div>
                    <div>
                      <p className="text-2xl font-semibold text-blue-600">{service._count?.quoteItems || 0}</p>
                      <p className="text-sm text-gray-600">In Quotes</p>
                    </div>
                    <div>
                      <p className="text-2xl font-semibold text-green-600">{service._count?.invoiceItems || 0}</p>
                      <p className="text-sm text-gray-600">In Invoices</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Usage */}
            {(service.quoteItems?.length || service.invoiceItems?.length) && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Recent Usage</h3>
                <div className="space-y-4">
                  {/* Quote Items */}
                  {service.quoteItems?.slice(0, 5).map(item => (
                    <div key={`quote-${item.id}`} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div>
                        <p className="font-medium text-blue-900">
                          Quote #{item.quote.number}
                        </p>
                        <p className="text-sm text-blue-700">
                          {item.quote.client.name}
                          {item.quote.client.company && ` (${item.quote.client.company})`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-blue-900">
                          {item.quantity} × {serviceUtils.formatRate(item.rate)}
                        </p>
                        <p className="text-sm text-blue-700">
                          = {serviceUtils.formatRate(item.quantity * item.rate)}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Invoice Items */}
                  {service.invoiceItems?.slice(0, 5).map(item => (
                    <div key={`invoice-${item.id}`} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div>
                        <p className="font-medium text-green-900">
                          Invoice #{item.invoice.number}
                        </p>
                        <p className="text-sm text-green-700">
                          {item.invoice.client.name}
                          {item.invoice.client.company && ` (${item.invoice.client.company})`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-900">
                          {item.quantity} × {serviceUtils.formatRate(item.rate)}
                        </p>
                        <p className="text-sm text-green-700">
                          = {serviceUtils.formatRate(item.quantity * item.rate)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Service Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Service Information</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-600">SKU</p>
                  <p className="text-sm text-gray-900 font-mono">{service.sku}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <div className="flex items-center">
                    {service.active ? (
                      <>
                        <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
                        <span className="text-sm text-green-700">Active</span>
                      </>
                    ) : (
                      <>
                        <XCircleIcon className="h-4 w-4 text-red-500 mr-1" />
                        <span className="text-sm text-red-700">Inactive</span>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600">Category</p>
                  <p className="text-sm text-gray-900">{service.category}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600">Unit</p>
                  <p className="text-sm text-gray-900 capitalize">{service.unit}</p>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <ClockIcon className="h-5 w-5 mr-2" />
                Timeline
              </h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-600">Created</p>
                  <p className="text-sm text-gray-900">
                    {new Date(service.createdAt).toLocaleString()}
                  </p>
                </div>

                {new Date(service.updatedAt).getTime() !== new Date(service.createdAt).getTime() && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Last Updated</p>
                    <p className="text-sm text-gray-900">
                      {new Date(service.updatedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors">
                  Add to Quote
                </button>
                <button className="w-full px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors">
                  View Usage History
                </button>
                <button className="w-full px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors">
                  Duplicate Service
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}