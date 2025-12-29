'use client'

import { useState } from 'react'
import { ArrowPathIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'

interface SyncButtonProps {
  entityType: 'client' | 'quote' | 'invoice'
  entityId: string
  zohoId?: string | null
  syncStatus?: string
  onSyncComplete?: (result: { success: boolean; zohoId?: string; error?: string }) => void
  size?: 'sm' | 'md'
}

export function SyncButton({
  entityType,
  entityId,
  zohoId,
  syncStatus,
  onSyncComplete,
  size = 'sm',
}: SyncButtonProps) {
  const [syncing, setSyncing] = useState(false)
  const [lastResult, setLastResult] = useState<'success' | 'error' | null>(null)

  const handleSync = async () => {
    setSyncing(true)
    setLastResult(null)

    try {
      let endpoint = '/api/zoho/sync/'
      let body: Record<string, string> = {}

      switch (entityType) {
        case 'client':
          endpoint += 'clients'
          body = { clientId: entityId }
          break
        case 'quote':
          endpoint += 'quotes'
          body = { quoteId: entityId }
          break
        case 'invoice':
          endpoint += 'invoices'
          body = { invoiceId: entityId }
          break
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        setLastResult('error')
        onSyncComplete?.({ success: false, error: data.error })
      } else {
        setLastResult('success')
        onSyncComplete?.({
          success: true,
          zohoId: data.zohoBooksContactId || data.zohoBooksEstimateId || data.zohoBooksInvoiceId,
        })
      }
    } catch (error) {
      setLastResult('error')
      onSyncComplete?.({ success: false, error: 'Sync failed' })
    } finally {
      setSyncing(false)

      // Clear result indicator after 3 seconds
      setTimeout(() => setLastResult(null), 3000)
    }
  }

  const isSynced = syncStatus === 'SYNCED' || !!zohoId
  const isFailed = syncStatus === 'FAILED'

  const sizeClasses = size === 'sm' ? 'p-1' : 'p-2'
  const iconClasses = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handleSync}
        disabled={syncing}
        className={`rounded ${sizeClasses} transition-colors ${
          isSynced
            ? 'text-green-600 hover:bg-green-50'
            : isFailed
            ? 'text-red-600 hover:bg-red-50'
            : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
        } disabled:opacity-50`}
        title={
          syncing
            ? 'Syncing...'
            : isSynced
            ? `Synced to Zoho${zohoId ? ` (${zohoId.slice(0, 8)}...)` : ''}`
            : isFailed
            ? 'Sync failed - Click to retry'
            : 'Sync to Zoho'
        }
      >
        {syncing ? (
          <ArrowPathIcon className={`${iconClasses} animate-spin`} />
        ) : lastResult === 'success' ? (
          <CheckCircleIcon className={`${iconClasses} text-green-600`} />
        ) : lastResult === 'error' ? (
          <ExclamationCircleIcon className={`${iconClasses} text-red-600`} />
        ) : isSynced ? (
          <CheckCircleIcon className={iconClasses} />
        ) : isFailed ? (
          <ExclamationCircleIcon className={iconClasses} />
        ) : (
          <ArrowPathIcon className={iconClasses} />
        )}
      </button>

      {/* Sync status indicator */}
      {size === 'md' && (
        <span
          className={`text-xs ${
            isSynced ? 'text-green-600' : isFailed ? 'text-red-600' : 'text-gray-400'
          }`}
        >
          {syncing ? 'Syncing...' : isSynced ? 'Synced' : isFailed ? 'Failed' : 'Not synced'}
        </span>
      )}
    </div>
  )
}

export default SyncButton
