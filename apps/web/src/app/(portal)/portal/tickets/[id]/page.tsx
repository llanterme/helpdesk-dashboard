'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Message {
  id: string
  content: string
  senderType: 'CLIENT' | 'AGENT'
  timestamp: string
  sender: {
    name: string
    email: string
  }
}

interface Ticket {
  id: string
  ticketNumber: string
  subject: string
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING' | 'RESOLVED' | 'CLOSED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  channel: 'WHATSAPP' | 'EMAIL' | 'FORM' | 'CHAT'
  createdAt: string
  updatedAt: string
  client: {
    name: string
    email: string
  }
  messages: Message[]
}

const statusConfig = {
  OPEN: { label: 'Open', color: 'bg-blue-100 text-blue-800', description: 'We have received your enquiry' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800', description: 'We are working on your request' },
  WAITING: { label: 'Awaiting Response', color: 'bg-purple-100 text-purple-800', description: 'We need additional information from you' },
  RESOLVED: { label: 'Resolved', color: 'bg-green-100 text-green-800', description: 'Your request has been completed' },
  CLOSED: { label: 'Closed', color: 'bg-gray-100 text-gray-800', description: 'This ticket is closed' },
}

const priorityConfig = {
  LOW: { label: 'Low', color: 'text-gray-500' },
  MEDIUM: { label: 'Medium', color: 'text-blue-500' },
  HIGH: { label: 'High', color: 'text-orange-500' },
  URGENT: { label: 'Urgent', color: 'text-red-500' },
}

const channelIcons = {
  WHATSAPP: '📱',
  EMAIL: '📧',
  FORM: '📝',
  CHAT: '💬',
}

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [replyMessage, setReplyMessage] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchTicket()
  }, [resolvedParams.id])

  const fetchTicket = async () => {
    try {
      const email = sessionStorage.getItem('portal_email')
      if (!email) {
        router.push('/portal')
        return
      }

      const response = await fetch(`/api/portal/tickets/${resolvedParams.id}?email=${encodeURIComponent(email)}`)
      const data = await response.json()

      if (response.ok) {
        setTicket(data)
      } else {
        setError(data.error || 'Failed to load ticket')
      }
    } catch (err) {
      setError('Failed to load ticket details')
    } finally {
      setLoading(false)
    }
  }

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyMessage.trim()) return

    setSending(true)
    try {
      const email = sessionStorage.getItem('portal_email')
      const response = await fetch(`/api/portal/tickets/${resolvedParams.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: replyMessage,
          email,
        }),
      })

      if (response.ok) {
        setReplyMessage('')
        fetchTicket() // Refresh to show new message
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to send reply')
      }
    } catch (err) {
      alert('Failed to send reply')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-slate-600 rounded-full" />
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Ticket</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <Link
          href="/portal"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Portal
        </Link>
      </div>
    )
  }

  const status = statusConfig[ticket.status]
  const priority = priorityConfig[ticket.priority]

  return (
    <div>
      {/* Back Link */}
      <Link
        href="/portal"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Portal
      </Link>

      {/* Ticket Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{channelIcons[ticket.channel]}</span>
              <h1 className="text-xl font-bold text-gray-900">{ticket.ticketNumber}</h1>
            </div>
            <p className="text-gray-600">{ticket.subject}</p>
          </div>
          <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
            {status.label}
          </div>
        </div>

        {/* Status Description */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="text-gray-700">{status.description}</p>
        </div>

        {/* Ticket Info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Priority</p>
            <p className={`font-medium ${priority.color}`}>{priority.label}</p>
          </div>
          <div>
            <p className="text-gray-500">Created</p>
            <p className="font-medium text-gray-900">
              {new Date(ticket.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Last Updated</p>
            <p className="font-medium text-gray-900">
              {new Date(ticket.updatedAt).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Channel</p>
            <p className="font-medium text-gray-900 capitalize">{ticket.channel.toLowerCase()}</p>
          </div>
        </div>
      </div>

      {/* Message Thread */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Conversation</h2>
        </div>

        <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
          {ticket.messages.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No messages yet</p>
          ) : (
            ticket.messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.senderType === 'CLIENT' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.senderType === 'CLIENT'
                      ? 'bg-slate-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">
                      {message.senderType === 'CLIENT' ? 'You' : 'Easy Services'}
                    </span>
                    <span className={`text-xs ${message.senderType === 'CLIENT' ? 'text-slate-300' : 'text-gray-500'}`}>
                      {new Date(message.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Reply Form */}
        {ticket.status !== 'CLOSED' && (
          <form onSubmit={handleReply} className="p-4 border-t border-gray-200">
            <div className="flex gap-3">
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your reply..."
                rows={2}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-none"
              />
              <button
                type="submit"
                disabled={sending || !replyMessage.trim()}
                className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {sending ? (
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  'Send'
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Contact Options */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800 mb-3">
          Need faster assistance? Contact us directly:
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href={`https://wa.me/27726583987?text=Hi%2C%20I'm%20following%20up%20on%20ticket%20${ticket.ticketNumber}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
            target="_blank"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </a>
          <a
            href="tel:+27726583987"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            +27 72 658 3987
          </a>
        </div>
      </div>
    </div>
  )
}
