'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  EnvelopeIcon,
  EnvelopeOpenIcon,
  PaperClipIcon,
  ArrowPathIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  TicketIcon,
  UserIcon,
  DocumentTextIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline'
import { EmailDetailPanel } from './EmailDetailPanel'

interface Email {
  id: string
  accountId: string
  accountEmail: string
  subject: string
  from: { name: string; address: string }
  to: Array<{ name: string; address: string }>
  bodyPreview: string
  receivedDateTime: string
  isRead: boolean
  hasAttachments: boolean
  conversationId: string
}

interface EmailAccount {
  id: string
  email: string
  displayName: string
  isActive: boolean
}

export function EmailInbox() {
  const [emails, setEmails] = useState<Email[]>([])
  const [accounts, setAccounts] = useState<EmailAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [filters, setFilters] = useState({
    accountId: '',
    unreadOnly: false,
    search: '',
  })
  const [showFilters, setShowFilters] = useState(false)

  const fetchAccounts = useCallback(async () => {
    try {
      const response = await fetch('/api/email/accounts')
      const data = await response.json()
      setAccounts(data.accounts || [])
    } catch (error) {
      console.error('Failed to fetch accounts:', error)
    }
  }, [])

  const fetchEmails = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.accountId) params.set('accountId', filters.accountId)
      if (filters.unreadOnly) params.set('unreadOnly', 'true')
      if (filters.search) params.set('search', filters.search)

      const response = await fetch(`/api/email/inbox?${params}`)
      const data = await response.json()
      setEmails(data.emails || [])
    } catch (error) {
      console.error('Failed to fetch emails:', error)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  useEffect(() => {
    if (accounts.length > 0) {
      fetchEmails()
    } else {
      setLoading(false)
    }
  }, [accounts, fetchEmails])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const getAccountColor = (email: string) => {
    if (email.includes('info@')) return 'bg-blue-500'
    if (email.includes('support@')) return 'bg-green-500'
    if (email.includes('sales@')) return 'bg-amber-500'
    return 'bg-gray-500'
  }

  const handleEmailClick = (email: Email) => {
    setSelectedEmail(email)
  }

  const handleCloseDetail = () => {
    setSelectedEmail(null)
    fetchEmails() // Refresh to update read status
  }

  const handleTicketCreated = () => {
    fetchEmails()
  }

  if (accounts.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <EnvelopeIcon className="w-16 h-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Email Accounts Connected
        </h3>
        <p className="text-gray-500 mb-4">
          Connect your email accounts in Settings to start receiving emails.
        </p>
        <a
          href="/settings/email"
          className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md"
        >
          Connect Email Account
        </a>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Email List */}
      <div
        className={`${
          selectedEmail ? 'hidden lg:block lg:w-1/3' : 'w-full'
        } border-r border-gray-200 flex flex-col`}
      >
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search emails..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                onKeyDown={(e) => e.key === 'Enter' && fetchEmails()}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-md ${
                showFilters ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100'
              }`}
            >
              <FunnelIcon className="w-5 h-5" />
            </button>
            <button
              onClick={fetchEmails}
              disabled={loading}
              className="p-2 text-gray-400 hover:bg-gray-100 rounded-md disabled:opacity-50"
            >
              <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {showFilters && (
            <div className="flex items-center gap-3 pt-2">
              <select
                value={filters.accountId}
                onChange={(e) =>
                  setFilters({ ...filters, accountId: e.target.value })
                }
                className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Accounts</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.displayName}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={filters.unreadOnly}
                  onChange={(e) =>
                    setFilters({ ...filters, unreadOnly: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 rounded"
                />
                Unread only
              </label>
            </div>
          )}
        </div>

        {/* Email List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <ArrowPathIcon className="w-8 h-8 text-gray-400 animate-spin" />
            </div>
          ) : emails.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
              <EnvelopeOpenIcon className="w-12 h-12 text-gray-300 mb-2" />
              <p>No emails found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {emails.map((email) => (
                <div
                  key={`${email.accountId}-${email.id}`}
                  onClick={() => handleEmailClick(email)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    !email.isRead ? 'bg-blue-50/50' : ''
                  } ${
                    selectedEmail?.id === email.id ? 'bg-blue-100' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Account indicator */}
                    <div
                      className={`w-1 h-12 rounded-full ${getAccountColor(email.accountEmail)}`}
                      title={email.accountEmail}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={`text-sm truncate ${
                            !email.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'
                          }`}
                        >
                          {email.from.name || email.from.address}
                        </p>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatDate(email.receivedDateTime)}
                        </span>
                      </div>

                      <p
                        className={`text-sm truncate mt-0.5 ${
                          !email.isRead ? 'font-medium text-gray-900' : 'text-gray-700'
                        }`}
                      >
                        {email.subject || '(No Subject)'}
                      </p>

                      <p className="text-xs text-gray-500 truncate mt-1">
                        {email.bodyPreview}
                      </p>

                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-400">
                          → {email.accountEmail.split('@')[0]}
                        </span>
                        {email.hasAttachments && (
                          <PaperClipIcon className="w-3 h-3 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {!email.isRead && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Email Detail Panel */}
      {selectedEmail && (
        <div className="flex-1 lg:w-2/3">
          <EmailDetailPanel
            email={selectedEmail}
            onClose={handleCloseDetail}
            onTicketCreated={handleTicketCreated}
          />
        </div>
      )}
    </div>
  )
}
