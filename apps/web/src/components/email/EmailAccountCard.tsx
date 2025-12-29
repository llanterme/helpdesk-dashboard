'use client'

import { useState } from 'react'
import {
  EnvelopeIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  TrashIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline'

interface EmailAccount {
  id: string
  email: string
  displayName: string
  provider: string
  isActive: boolean
  isDefault: boolean
  syncEnabled: boolean
  autoCreateTickets: boolean
  signature?: string | null
  lastSyncAt: string | null
  syncError: string | null
  ticketCount: number
  hasValidSubscription: boolean
  isAuthenticated: boolean
}

interface EmailAccountCardProps {
  account: EmailAccount
  onRefresh?: () => void
  onDelete?: (id: string) => void
  onEdit?: (account: EmailAccount) => void
  onSetDefault?: (id: string) => void
}

export function EmailAccountCard({
  account,
  onRefresh,
  onDelete,
  onEdit,
  onSetDefault,
}: EmailAccountCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to remove ${account.email}?`)) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/email/accounts/${account.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        onDelete?.(account.id)
      } else {
        alert('Failed to delete account')
      }
    } catch (error) {
      console.error('Delete failed:', error)
      alert('Failed to delete account')
    } finally {
      setIsDeleting(false)
    }
  }

  const getStatusBadge = () => {
    if (!account.isAuthenticated) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 rounded-full">
          <ExclamationCircleIcon className="w-3 h-3" />
          Needs Setup
        </span>
      )
    }

    if (!account.isActive) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
          Inactive
        </span>
      )
    }

    if (account.syncError) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full">
          <ExclamationCircleIcon className="w-3 h-3" />
          Sync Error
        </span>
      )
    }

    if (!account.hasValidSubscription) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 rounded-full">
          <ExclamationCircleIcon className="w-3 h-3" />
          Subscription Expired
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
        <CheckCircleIcon className="w-3 h-3" />
        Connected
      </span>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <EnvelopeIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-gray-900">{account.displayName}</h3>
              {account.isDefault && (
                <span className="px-1.5 py-0.5 text-xs font-medium text-blue-700 bg-blue-100 rounded">
                  Default
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">{account.email}</p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 text-center text-sm">
        <div>
          <p className="text-gray-500">Tickets</p>
          <p className="font-semibold text-gray-900">{account.ticketCount}</p>
        </div>
        <div>
          <p className="text-gray-500">Auto-Create</p>
          <p className="font-semibold text-gray-900">
            {account.autoCreateTickets ? 'Yes' : 'No'}
          </p>
        </div>
        <div>
          <p className="text-gray-500">Last Sync</p>
          <p className="font-semibold text-gray-900">
            {account.lastSyncAt
              ? new Date(account.lastSyncAt).toLocaleDateString()
              : 'Never'}
          </p>
        </div>
      </div>

      {account.syncError && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          {account.syncError}
        </div>
      )}

      <div className="mt-4 flex items-center gap-2 pt-3 border-t border-gray-100">
        {!account.isDefault && account.isAuthenticated && (
          <button
            onClick={() => onSetDefault?.(account.id)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Set as Default
          </button>
        )}
        <div className="flex-1" />
        <button
          onClick={() => onEdit?.(account)}
          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
          title="Settings"
        >
          <Cog6ToothIcon className="w-4 h-4" />
        </button>
        <button
          onClick={onRefresh}
          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
          title="Refresh"
        >
          <ArrowPathIcon className="w-4 h-4" />
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
          title="Delete"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
