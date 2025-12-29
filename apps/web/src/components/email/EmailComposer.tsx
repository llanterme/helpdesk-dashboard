'use client'

import { useState, useEffect } from 'react'
import {
  XMarkIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  DocumentTextIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline'

interface EmailAccount {
  id: string
  email: string
  displayName: string
  isDefault: boolean
}

interface EmailComposerProps {
  mode: 'compose' | 'reply'
  ticketId?: string
  clientEmail?: string
  subject?: string
  inReplyTo?: string
  onClose: () => void
  onSent: () => void
  // For quote/invoice sending
  quoteId?: string
  invoiceId?: string
}

export function EmailComposer({
  mode,
  ticketId,
  clientEmail,
  subject,
  inReplyTo,
  onClose,
  onSent,
  quoteId,
  invoiceId,
}: EmailComposerProps) {
  const [accounts, setAccounts] = useState<EmailAccount[]>([])
  const [formData, setFormData] = useState({
    accountId: '',
    to: clientEmail || '',
    cc: '',
    bcc: '',
    subject: mode === 'reply' && subject ? `RE: ${subject}` : subject || '',
    body: '',
  })
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/email/accounts')
      const data = await response.json()
      const activeAccounts = (data.accounts || []).filter(
        (acc: EmailAccount & { isActive: boolean }) => acc.isActive
      )
      setAccounts(activeAccounts)

      // Set default account
      const defaultAccount = activeAccounts.find((acc: EmailAccount) => acc.isDefault)
      if (defaultAccount) {
        setFormData((prev) => ({ ...prev, accountId: defaultAccount.id }))
      } else if (activeAccounts.length > 0) {
        setFormData((prev) => ({ ...prev, accountId: activeAccounts[0].id }))
      }
    } catch (error) {
      console.error('Failed to fetch accounts:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSending(true)

    try {
      let requestBody: Record<string, unknown>

      if (quoteId) {
        requestBody = {
          type: 'quote',
          quoteId,
          accountId: formData.accountId,
          subject: formData.subject,
          body: formData.body || undefined,
          ticketId,
        }
      } else if (invoiceId) {
        requestBody = {
          type: 'invoice',
          invoiceId,
          accountId: formData.accountId,
          subject: formData.subject,
          body: formData.body || undefined,
          ticketId,
        }
      } else if (mode === 'reply' && ticketId) {
        requestBody = {
          type: 'reply',
          ticketId,
          accountId: formData.accountId,
          body: formData.body,
          isHtml: true,
        }
      } else {
        requestBody = {
          type: 'compose',
          accountId: formData.accountId,
          to: formData.to.split(',').map((e) => e.trim()),
          cc: formData.cc ? formData.cc.split(',').map((e) => e.trim()) : undefined,
          bcc: formData.bcc ? formData.bcc.split(',').map((e) => e.trim()) : undefined,
          subject: formData.subject,
          body: formData.body,
          isHtml: true,
          ticketId,
          inReplyTo,
        }
      }

      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email')
      }

      onSent()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSending(false)
    }
  }

  const selectedAccount = accounts.find((acc) => acc.id === formData.accountId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">
            {quoteId
              ? 'Send Quote'
              : invoiceId
              ? 'Send Invoice'
              : mode === 'reply'
              ? 'Reply to Email'
              : 'Compose Email'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            {/* From Account */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From
              </label>
              <select
                value={formData.accountId}
                onChange={(e) =>
                  setFormData({ ...formData, accountId: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select account...</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.displayName} &lt;{acc.email}&gt;
                  </option>
                ))}
              </select>
            </div>

            {/* To */}
            {!quoteId && !invoiceId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To
                </label>
                <input
                  type="text"
                  value={formData.to}
                  onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="recipient@example.com"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separate multiple addresses with commas
                </p>
              </div>
            )}

            {/* CC/BCC (collapsed by default) */}
            {!quoteId && !invoiceId && mode !== 'reply' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CC
                  </label>
                  <input
                    type="text"
                    value={formData.cc}
                    onChange={(e) => setFormData({ ...formData, cc: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="cc@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    BCC
                  </label>
                  <input
                    type="text"
                    value={formData.bcc}
                    onChange={(e) => setFormData({ ...formData, bcc: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="bcc@example.com"
                  />
                </div>
              </div>
            )}

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Email subject"
                required={!quoteId && !invoiceId}
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message
                {(quoteId || invoiceId) && (
                  <span className="text-gray-400 font-normal ml-1">
                    (Leave empty for default)
                  </span>
                )}
              </label>
              <textarea
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={
                  quoteId
                    ? 'Add a personal message (optional)...'
                    : invoiceId
                    ? 'Add a personal message (optional)...'
                    : 'Write your message...'
                }
                required={!quoteId && !invoiceId}
              />
            </div>

            {/* Info boxes */}
            {quoteId && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-blue-800">
                  Quote details will be automatically included in the email
                </span>
              </div>
            )}

            {invoiceId && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                <BanknotesIcon className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-800">
                  Invoice details will be automatically included in the email
                </span>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                {error}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
            <div className="flex items-center gap-2">
              {/* TODO: Attachment button */}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sending || !formData.accountId}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PaperAirplaneIcon className="w-4 h-4" />
                {sending ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
