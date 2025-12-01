'use client'

import { Service, serviceUtils } from '@/stores/serviceStore'
import {
  PencilIcon,
  TrashIcon,
  EyeIcon,
  TagIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

interface ServiceCardProps {
  service: Service
  onView?: (service: Service) => void
  onEdit?: (service: Service) => void
  onDelete?: (service: Service) => void
  onToggleStatus?: (service: Service) => void
  onAddToQuote?: (service: Service) => void
  className?: string
  showActions?: boolean
}

export function ServiceCard({
  service,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
  onAddToQuote,
  className = '',
  showActions = true
}: ServiceCardProps) {
  const categoryColor = serviceUtils.getCategoryColor(service.category)
  const totalUsage = (service._count?.quoteItems || 0) + (service._count?.invoiceItems || 0)

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium text-gray-900 truncate">
              {service.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: `${categoryColor}15`,
                  color: categoryColor,
                  border: `1px solid ${categoryColor}30`
                }}
              >
                <TagIcon className="w-3 h-3 mr-1" />
                {service.category}
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                {serviceUtils.formatSku(service.sku)}
              </span>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="flex-shrink-0 ml-4">
            {service.active ? (
              <CheckCircleIcon className="h-5 w-5 text-green-500" title="Active" />
            ) : (
              <XCircleIcon className="h-5 w-5 text-red-500" title="Inactive" />
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Description */}
        {service.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {service.description}
          </p>
        )}

        {/* Pricing */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center text-sm text-gray-600">
            <CurrencyDollarIcon className="h-4 w-4 mr-1" />
            <span className="font-medium text-gray-900">
              {serviceUtils.formatRate(service.rate)}
            </span>
            <span className="ml-1">per {service.unit}</span>
          </div>

          {/* Usage Statistics */}
          {totalUsage > 0 && (
            <div className="flex items-center text-sm text-gray-500">
              <ChartBarIcon className="h-4 w-4 mr-1" />
              <span>{totalUsage} usage{totalUsage !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Usage Breakdown */}
        {(service._count?.quoteItems || service._count?.invoiceItems) && (
          <div className="text-xs text-gray-500 mb-3">
            {service._count.quoteItems > 0 && (
              <span>{service._count.quoteItems} quote{service._count.quoteItems !== 1 ? 's' : ''}</span>
            )}
            {service._count.quoteItems > 0 && service._count.invoiceItems > 0 && ' • '}
            {service._count.invoiceItems > 0 && (
              <span>{service._count.invoiceItems} invoice{service._count.invoiceItems !== 1 ? 's' : ''}</span>
            )}
          </div>
        )}

        {/* Metadata */}
        <div className="text-xs text-gray-500">
          <div>Created {new Date(service.createdAt).toLocaleDateString()}</div>
          {new Date(service.updatedAt).getTime() !== new Date(service.createdAt).getTime() && (
            <div>Updated {new Date(service.updatedAt).toLocaleDateString()}</div>
          )}
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 rounded-b-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {onView && (
                <button
                  onClick={() => onView(service)}
                  className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
                  title="View details"
                >
                  <EyeIcon className="h-4 w-4" />
                </button>
              )}

              {onEdit && (
                <button
                  onClick={() => onEdit(service)}
                  className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Edit service"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
              )}

              {onDelete && (
                <button
                  onClick={() => onDelete(service)}
                  className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Delete service"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {onToggleStatus && (
                <button
                  onClick={() => onToggleStatus(service)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    service.active
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {service.active ? 'Deactivate' : 'Activate'}
                </button>
              )}

              {onAddToQuote && service.active && (
                <button
                  onClick={() => onAddToQuote(service)}
                  className="px-3 py-1 text-xs font-medium bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors"
                >
                  Add to Quote
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}