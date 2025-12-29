'use client'

import { useState, useEffect } from 'react'
import {
  XMarkIcon,
  ArrowLeftIcon,
  PaperClipIcon,
  TicketIcon,
  UserIcon,
  DocumentTextIcon,
  BanknotesIcon,
  ArrowTopRightOnSquareIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline'
import { ClientContextPanel } from './ClientContextPanel'

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

interface EmailDetail {
  email: {
    id: string
    internetMessageId: string
    subject: string
    from: { name: string; address: string }
    to: Array<{ name: string; address: string }>
    cc: Array<{ name: string; address: string }>
    body: { contentType: string; content: string }
    bodyPreview: string
    receivedDateTime: string
    sentDateTime: string
    isRead: boolean
    hasAttachments: boolean
    attachments: Array<{
      id: string
      name: string
      contentType: string
      size: number
      isInline: boolean
    }>
  }
  client: {
    id: string
    name: string
    email: string
    phone: string | null
    company: string | null
    zohoCrmContactId: string | null
    zohoBooksContactId: string | null
  } | null
  clientSource: 'local' | 'zoho_crm' | 'zoho_books' | 'new'
  clientContext: {
    quotes: Array<{
      id: string
      number: string
      status: string
      totalAmount: number
      createdAt: string
    }>
    invoices: Array<{
      id: string
      number: string | null
      status: string
      totalAmount: number
      dueDate: string | null
      createdAt: string
    }>
    tickets: Array<{
      id: string
      subject: string
      channel: string
      status: string
      createdAt: string
    }>
    stats: {
      totalQuotes: number
      pendingQuotes: number
      pendingQuotesTotal: number
      totalInvoices: number
      unpaidInvoices: number
      unpaidTotal: number
      overdueInvoices: number
      openTickets: number
    }
  } | null
  existingTicket: {
    id: string
    subject: string
    status: string
    channel: string
  } | null
}

interface EmailDetailPanelProps {
  email: Email
  onClose: () => void
  onTicketCreated: () => void
}

export function EmailDetailPanel({
  email,
  onClose,
  onTicketCreated,
}: EmailDetailPanelProps) {
  const [detail, setDetail] = useState<EmailDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [converting, setConverting] = useState(false)
  const [showClientContext, setShowClientContext] = useState(true)
  const [convertError, setConvertError] = useState('')

  useEffect(() => {
    fetchEmailDetail()
  }, [email.id, email.accountId])

  const fetchEmailDetail = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/email/inbox/${email.id}?accountId=${email.accountId}`
      )
      const data = await response.json()
      setDetail(data)
    } catch (error) {
      console.error('Failed to fetch email detail:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConvertToTicket = async () => {
    setConverting(true)
    setConvertError('')

    try {
      const response = await fetch(`/api/email/inbox/${email.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: email.accountId,
          clientId: detail?.client?.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create ticket')
      }

      // Redirect to the ticket
      window.location.href = `/tickets/${data.ticketId}`
    } catch (error) {
      setConvertError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setConverting(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getClientSourceBadge = () => {
    if (!detail) return null

    switch (detail.clientSource) {
      case 'local':
        return (
          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">
            Existing Client
          </span>
        )
      case 'zoho_crm':
        return (
          <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
            From Zoho CRM
          </span>
        )
      case 'zoho_books':
        return (
          <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
            From Zoho Books
          </span>
        )
      case 'new':
        return (
          <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded">
            New Contact
          </span>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <p>Failed to load email</p>
        <button
          onClick={onClose}
          className="mt-2 text-blue-600 hover:underline"
        >
          Go back
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Main Email Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={onClose}
              className="lg:hidden p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              {detail.existingTicket ? (
                <a
                  href={`/tickets/${detail.existingTicket.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md"
                >
                  <TicketIcon className="w-4 h-4" />
                  View Ticket #{detail.existingTicket.id.slice(-6)}
                </a>
              ) : (
                <button
                  onClick={handleConvertToTicket}
                  disabled={converting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
                >
                  <TicketIcon className="w-4 h-4" />
                  {converting ? 'Creating...' : 'Create Ticket'}
                </button>
              )}
              <button
                onClick={() => setShowClientContext(!showClientContext)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded lg:hidden"
              >
                <UserIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {convertError && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {convertError}
            </div>
          )}

          <h1 className="text-xl font-semibold text-gray-900">
            {detail.email.subject || '(No Subject)'}
          </h1>

          <div className="mt-3 flex items-start gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium">
              {(detail.email.from.name || detail.email.from.address)[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">
                  {detail.email.from.name || detail.email.from.address}
                </span>
                {getClientSourceBadge()}
              </div>
              <p className="text-sm text-gray-500">{detail.email.from.address}</p>
              <p className="text-xs text-gray-400 mt-1">
                To: {detail.email.to.map((t) => t.address).join(', ')}
                {detail.email.cc.length > 0 && (
                  <> | CC: {detail.email.cc.map((c) => c.address).join(', ')}</>
                )}
              </p>
            </div>
            <p className="text-sm text-gray-500">
              {new Date(detail.email.receivedDateTime).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Attachments */}
        {detail.email.attachments.length > 0 && (
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2 mb-2">
              <PaperClipIcon className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">
                {detail.email.attachments.length} Attachment
                {detail.email.attachments.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {detail.email.attachments
                .filter((att) => !att.isInline)
                .map((att) => (
                  <div
                    key={att.id}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-md text-sm"
                  >
                    <span className="text-gray-700 truncate max-w-[200px]">
                      {att.name}
                    </span>
                    <span className="text-gray-400 text-xs">
                      ({formatFileSize(att.size)})
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Email Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {detail.email.body.contentType === 'html' ? (
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: detail.email.body.content }}
            />
          ) : (
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
              {detail.email.body.content}
            </pre>
          )}
        </div>
      </div>

      {/* Client Context Sidebar */}
      {showClientContext && detail.client && detail.clientContext && (
        <div className="hidden lg:block w-80 border-l border-gray-200 overflow-y-auto">
          <ClientContextPanel
            client={detail.client}
            context={detail.clientContext}
          />
        </div>
      )}
    </div>
  )
}
