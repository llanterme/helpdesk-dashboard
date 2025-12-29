'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  PlusIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline'
import {
  EmailAccountCard,
  EmailAccountSettings,
  AddEmailAccountModal,
} from '@/components/email'

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

function EmailSettingsContent() {
  const searchParams = useSearchParams()
  const [accounts, setAccounts] = useState<EmailAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingAccount, setEditingAccount] = useState<EmailAccount | null>(null)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  useEffect(() => {
    fetchAccounts()
  }, [])

  useEffect(() => {
    // Check for OAuth callback results
    const success = searchParams.get('success')
    const error = searchParams.get('error')
    const accountId = searchParams.get('account')

    if (success === 'true') {
      setNotification({
        type: 'success',
        message: 'Email account connected successfully!',
      })
      fetchAccounts()
    } else if (error) {
      setNotification({
        type: 'error',
        message: `Failed to connect: ${decodeURIComponent(error)}`,
      })
    }

    // Clear URL params after showing notification
    if (success || error) {
      window.history.replaceState({}, '', '/settings/email')
    }
  }, [searchParams])

  const fetchAccounts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/email/accounts')
      const data = await response.json()
      setAccounts(data.accounts || [])
    } catch (error) {
      console.error('Failed to fetch accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSetDefault = async (accountId: string) => {
    try {
      const response = await fetch(`/api/email/accounts/${accountId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      })

      if (response.ok) {
        fetchAccounts()
      }
    } catch (error) {
      console.error('Failed to set default:', error)
    }
  }

  const handleDelete = (accountId: string) => {
    setAccounts(accounts.filter((acc) => acc.id !== accountId))
    setNotification({
      type: 'success',
      message: 'Email account removed successfully',
    })
  }

  const handleSaveSettings = (updatedAccount: EmailAccount) => {
    setAccounts(
      accounts.map((acc) => (acc.id === updatedAccount.id ? updatedAccount : acc))
    )
    setEditingAccount(null)
    setNotification({
      type: 'success',
      message: 'Settings saved successfully',
    })
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Email Integration</h1>
        <p className="text-gray-500 mt-1">
          Connect and manage your email accounts for the helpdesk
        </p>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            notification.type === 'success'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircleIcon className="w-5 h-5 text-green-600" />
          ) : (
            <ExclamationCircleIcon className="w-5 h-5 text-red-600" />
          )}
          <p
            className={`text-sm ${
              notification.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}
          >
            {notification.message}
          </p>
          <button
            onClick={() => setNotification(null)}
            className="ml-auto text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
      )}

      {/* Actions Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-gray-500">
          {accounts.length} email account{accounts.length !== 1 ? 's' : ''} connected
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAccounts}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md"
          >
            <PlusIcon className="w-4 h-4" />
            Add Account
          </button>
        </div>
      </div>

      {/* Accounts Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <ArrowPathIcon className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Email Accounts Connected
          </h3>
          <p className="text-gray-500 mb-4 max-w-md mx-auto">
            Connect your email accounts to receive and send emails directly from the
            helpdesk. Emails will automatically become tickets.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md"
          >
            <PlusIcon className="w-4 h-4" />
            Connect Your First Account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.map((account) => (
            <EmailAccountCard
              key={account.id}
              account={account}
              onRefresh={fetchAccounts}
              onDelete={handleDelete}
              onEdit={setEditingAccount}
              onSetDefault={handleSetDefault}
            />
          ))}
        </div>
      )}

      {/* Suggested Accounts Info */}
      {accounts.length > 0 && accounts.length < 3 && (
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Recommended Setup</h4>
          <p className="text-sm text-blue-800 mb-3">
            For optimal helpdesk operation, we recommend connecting all three email
            addresses:
          </p>
          <ul className="text-sm text-blue-800 space-y-1">
            {!accounts.find((a) => a.email.includes('info@')) && (
              <li>• info@easynotary.co.za - General inquiries</li>
            )}
            {!accounts.find((a) => a.email.includes('support@')) && (
              <li>• support@easyservicesgroup.co.za - Support requests</li>
            )}
            {!accounts.find((a) => a.email.includes('sales@')) && (
              <li>• sales@easyservicesgroup.co.za - Sales and quotes</li>
            )}
          </ul>
        </div>
      )}

      {/* Setup Instructions */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Setup Requirements</h4>
        <p className="text-sm text-gray-600 mb-3">
          To connect email accounts, you need:
        </p>
        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
          <li>Microsoft 365 or Exchange Online email accounts</li>
          <li>
            Azure AD App Registration with Mail.Read, Mail.ReadWrite, Mail.Send
            permissions
          </li>
          <li>
            Environment variables: MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET
          </li>
        </ul>
      </div>

      {/* Add Account Modal */}
      {showAddModal && (
        <AddEmailAccountModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            fetchAccounts()
          }}
        />
      )}

      {/* Edit Settings Modal */}
      {editingAccount && (
        <EmailAccountSettings
          account={editingAccount}
          onClose={() => setEditingAccount(null)}
          onSave={handleSaveSettings}
        />
      )}
    </div>
  )
}

export default function EmailSettingsPage() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex items-center justify-center py-12">
          <ArrowPathIcon className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      </div>
    }>
      <EmailSettingsContent />
    </Suspense>
  )
}
