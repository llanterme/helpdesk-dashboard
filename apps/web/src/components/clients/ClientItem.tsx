'use client'

import { formatDistanceToNow } from 'date-fns'
import { ClientWithStats } from '@/stores/clientStore'
import {
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  TicketIcon,
  DocumentTextIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'

interface ClientItemProps {
  client: ClientWithStats
  isSelected?: boolean
  onClick: () => void
}

export function ClientItem({ client, isSelected = false, onClick }: ClientItemProps) {
  return (
    <div
      onClick={onClick}
      className={`p-4 border border-gray-200 rounded-lg cursor-pointer transition-all hover:shadow-md ${
        isSelected
          ? 'border-slate-500 shadow-md bg-slate-50'
          : 'hover:border-gray-300'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {client.name}
          </h3>
          {client.company && (
            <div className="flex items-center gap-1 mt-1 text-sm text-gray-600">
              <BuildingOfficeIcon className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{client.company}</span>
            </div>
          )}
        </div>

        {/* Active Tickets Badge */}
        {client.activeTickets > 0 && (
          <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
            <TicketIcon className="h-3 w-3" />
            {client.activeTickets}
          </span>
        )}
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <EnvelopeIcon className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{client.email}</span>
        </div>

        {client.phone && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <PhoneIcon className="h-4 w-4 flex-shrink-0" />
            <span>{client.phone}</span>
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-100">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mb-1">
            <TicketIcon className="h-3 w-3" />
            <span>Tickets</span>
          </div>
          <div className="text-sm font-medium text-gray-900">
            {client.totalTickets}
          </div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mb-1">
            <DocumentTextIcon className="h-3 w-3" />
            <span>Quotes</span>
          </div>
          <div className="text-sm font-medium text-gray-900">
            {client.totalQuotes}
          </div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mb-1">
            <CurrencyDollarIcon className="h-3 w-3" />
            <span>Invoices</span>
          </div>
          <div className="text-sm font-medium text-gray-900">
            {client.totalInvoices}
          </div>
        </div>
      </div>

      {/* Last Activity */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          Created {formatDistanceToNow(new Date(client.createdAt), { addSuffix: true })}
        </div>
      </div>
    </div>
  )
}