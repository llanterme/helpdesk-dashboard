'use client'

import { useState, useEffect } from 'react'
import {
  ArrowPathIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'

interface SyncStats {
  total: number
  synced: number
  pending: number
  failed: number
}

interface SyncStatus {
  configured: boolean
  status?: {
    clients: SyncStats
    services: SyncStats
    quotes: SyncStats
    invoices: SyncStats
    lastSync?: string
  }
  recentLogs?: Array<{
    id: string
    entityType: string
    entityId: string
    direction: string
    status: string
    zohoId?: string | null
    errorMessage?: string | null
    createdAt: string
  }>
}

export function ZohoSyncDashboard() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/zoho/sync/full')
      const data = await res.json()
      setSyncStatus(data)
      setError(null)
    } catch (err) {
      setError('Failed to fetch sync status')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  const runSync = async (type: string, direction: 'from_zoho' | 'to_zoho') => {
    setSyncing(`${type}-${direction}`)
    setError(null)

    try {
      let endpoint = '/api/zoho/sync/'
      let body: Record<string, string> = {}

      switch (type) {
        case 'full':
          endpoint += 'full'
          body = { direction }
          break
        case 'clients':
          endpoint += 'clients'
          body = { direction }
          break
        case 'services':
          endpoint += 'services'
          break
        default:
          throw new Error(`Unknown sync type: ${type}`)
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Sync failed')
      }

      // Refresh status
      await fetchStatus()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setSyncing(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!syncStatus?.configured) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
        <div className="flex items-center gap-3">
          <ExclamationCircleIcon className="h-6 w-6 text-yellow-600" />
          <div>
            <h3 className="font-semibold text-yellow-800">Zoho Not Configured</h3>
            <p className="text-sm text-yellow-700">
              Please configure Zoho API credentials in your environment variables.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const { status, recentLogs } = syncStatus

  const StatCard = ({
    title,
    stats,
    onPull,
    onPush,
    pullDisabled,
    pushDisabled,
  }: {
    title: string
    stats: SyncStats
    onPull?: () => void
    onPush?: () => void
    pullDisabled?: boolean
    pushDisabled?: boolean
  }) => (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <div className="flex gap-2">
          {onPull && (
            <button
              onClick={onPull}
              disabled={pullDisabled}
              className="rounded p-1 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
              title="Pull from Zoho"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
            </button>
          )}
          {onPush && (
            <button
              onClick={onPush}
              disabled={pushDisabled}
              className="rounded p-1 text-green-600 hover:bg-green-50 disabled:opacity-50"
              title="Push to Zoho"
            >
              <ArrowUpTrayIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2 text-center">
        <div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-xs text-gray-500">Total</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-green-600">{stats.synced}</div>
          <div className="text-xs text-gray-500">Synced</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          <div className="text-xs text-gray-500">Pending</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
          <div className="text-xs text-gray-500">Failed</div>
        </div>
      </div>

      {stats.total > 0 && (
        <div className="mt-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full bg-green-500 transition-all"
              style={{ width: `${(stats.synced / stats.total) * 100}%` }}
            />
          </div>
          <div className="mt-1 text-xs text-gray-500 text-right">
            {Math.round((stats.synced / stats.total) * 100)}% synced
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Zoho Sync Status</h2>
          {status?.lastSync && (
            <p className="text-sm text-gray-500">
              Last sync: {new Date(status.lastSync).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => runSync('full', 'from_zoho')}
            disabled={!!syncing}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {syncing === 'full-from_zoho' ? (
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowDownTrayIcon className="h-4 w-4" />
            )}
            Pull from Zoho
          </button>
          <button
            onClick={() => runSync('full', 'to_zoho')}
            disabled={!!syncing}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {syncing === 'full-to_zoho' ? (
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUpTrayIcon className="h-4 w-4" />
            )}
            Push to Zoho
          </button>
          <button
            onClick={fetchStatus}
            disabled={!!syncing}
            className="rounded-lg border border-gray-300 p-2 hover:bg-gray-50 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-5 w-5 ${syncing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 text-red-700">
            <ExclamationCircleIcon className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      {status && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Clients"
            stats={status.clients}
            onPull={() => runSync('clients', 'from_zoho')}
            onPush={() => runSync('clients', 'to_zoho')}
            pullDisabled={!!syncing}
            pushDisabled={!!syncing}
          />
          <StatCard
            title="Services"
            stats={status.services}
            onPull={() => runSync('services', 'from_zoho')}
            pullDisabled={!!syncing}
          />
          <StatCard
            title="Quotes"
            stats={status.quotes}
          />
          <StatCard
            title="Invoices"
            stats={status.invoices}
          />
        </div>
      )}

      {/* Recent Sync Logs */}
      {recentLogs && recentLogs.length > 0 && (
        <div className="rounded-lg border bg-white shadow-sm">
          <div className="border-b px-4 py-3">
            <h3 className="font-semibold text-gray-900">Recent Sync Activity</h3>
          </div>
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-2">Time</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Direction</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-500">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-2 capitalize">{log.entityType}</td>
                    <td className="px-4 py-2">
                      {log.direction === 'FROM_ZOHO' ? (
                        <span className="flex items-center gap-1 text-blue-600">
                          <ArrowDownTrayIcon className="h-4 w-4" />
                          Pull
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-green-600">
                          <ArrowUpTrayIcon className="h-4 w-4" />
                          Push
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {log.status === 'success' ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircleIcon className="h-4 w-4" />
                          Success
                        </span>
                      ) : log.status === 'failed' ? (
                        <span className="flex items-center gap-1 text-red-600">
                          <ExclamationCircleIcon className="h-4 w-4" />
                          Failed
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-yellow-600">
                          <ClockIcon className="h-4 w-4" />
                          Skipped
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-gray-500">
                      {log.zohoId ? (
                        <span className="font-mono text-xs">{log.zohoId.slice(0, 12)}...</span>
                      ) : log.errorMessage ? (
                        <span className="text-red-500 text-xs">{log.errorMessage.slice(0, 30)}...</span>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default ZohoSyncDashboard
