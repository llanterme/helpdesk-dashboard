'use client'

import {
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  TicketIcon,
  DocumentTextIcon,
  BanknotesIcon,
  ExclamationTriangleIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'

interface ClientContextPanelProps {
  client: {
    id: string
    name: string
    email: string
    phone: string | null
    company: string | null
    zohoCrmContactId: string | null
    zohoBooksContactId: string | null
  }
  context: {
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
  }
}

export function ClientContextPanel({ client, context }: ClientContextPanelProps) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount)

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'OPEN':
      case 'PENDING':
      case 'SENT':
        return 'bg-yellow-100 text-yellow-700'
      case 'ACCEPTED':
      case 'PAID':
      case 'RESOLVED':
      case 'CLOSED':
        return 'bg-green-100 text-green-700'
      case 'REJECTED':
      case 'OVERDUE':
        return 'bg-red-100 text-red-700'
      case 'DRAFT':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'EMAIL':
        return <EnvelopeIcon className="w-3 h-3" />
      case 'WHATSAPP':
        return <PhoneIcon className="w-3 h-3" />
      default:
        return <TicketIcon className="w-3 h-3" />
    }
  }

  return (
    <div className="p-4 space-y-6">
      {/* Client Info */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <UserIcon className="w-5 h-5 text-gray-400" />
          <h3 className="font-medium text-gray-900">Client Information</h3>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-medium text-gray-900">{client.name}</p>
          {client.company && (
            <div className="flex items-center gap-2 text-gray-600">
              <BuildingOfficeIcon className="w-4 h-4" />
              {client.company}
            </div>
          )}
          <div className="flex items-center gap-2 text-gray-600">
            <EnvelopeIcon className="w-4 h-4" />
            {client.email}
          </div>
          {client.phone && (
            <div className="flex items-center gap-2 text-gray-600">
              <PhoneIcon className="w-4 h-4" />
              {client.phone}
            </div>
          )}
          <div className="flex items-center gap-2 pt-1">
            {client.zohoCrmContactId && (
              <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                CRM
              </span>
            )}
            {client.zohoBooksContactId && (
              <span className="px-1.5 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                Books
              </span>
            )}
          </div>
        </div>
        <a
          href={`/clients/${client.id}`}
          className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 hover:underline"
        >
          View Profile <ArrowTopRightOnSquareIcon className="w-3 h-3" />
        </a>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-gray-50 rounded-lg text-center">
          <p className="text-2xl font-bold text-gray-900">{context.stats.openTickets}</p>
          <p className="text-xs text-gray-500">Open Tickets</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg text-center">
          <p className="text-2xl font-bold text-gray-900">{context.stats.pendingQuotes}</p>
          <p className="text-xs text-gray-500">Pending Quotes</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg text-center">
          <p className="text-2xl font-bold text-gray-900">{context.stats.unpaidInvoices}</p>
          <p className="text-xs text-gray-500">Unpaid Invoices</p>
        </div>
        {context.stats.overdueInvoices > 0 && (
          <div className="p-3 bg-red-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-red-600">{context.stats.overdueInvoices}</p>
            <p className="text-xs text-red-600">Overdue</p>
          </div>
        )}
      </div>

      {/* Outstanding Amount */}
      {context.stats.unpaidTotal > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-2 text-amber-700">
            <BanknotesIcon className="w-5 h-5" />
            <span className="text-sm font-medium">Outstanding</span>
          </div>
          <p className="text-xl font-bold text-amber-700 mt-1">
            {formatCurrency(context.stats.unpaidTotal)}
          </p>
        </div>
      )}

      {/* Recent Quotes */}
      {context.quotes.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <DocumentTextIcon className="w-4 h-4 text-gray-400" />
              <h4 className="text-sm font-medium text-gray-900">Recent Quotes</h4>
            </div>
            <a
              href={`/quotes?client=${client.id}`}
              className="text-xs text-blue-600 hover:underline"
            >
              View All
            </a>
          </div>
          <div className="space-y-2">
            {context.quotes.slice(0, 3).map((quote) => (
              <a
                key={quote.id}
                href={`/quotes/${quote.id}`}
                className="block p-2 bg-gray-50 hover:bg-gray-100 rounded text-sm transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{quote.number}</span>
                  <span
                    className={`px-1.5 py-0.5 text-xs rounded ${getStatusColor(quote.status)}`}
                  >
                    {quote.status}
                  </span>
                </div>
                <p className="text-gray-600">{formatCurrency(quote.totalAmount)}</p>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Recent Invoices */}
      {context.invoices.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BanknotesIcon className="w-4 h-4 text-gray-400" />
              <h4 className="text-sm font-medium text-gray-900">Recent Invoices</h4>
            </div>
            <a
              href={`/invoices?client=${client.id}`}
              className="text-xs text-blue-600 hover:underline"
            >
              View All
            </a>
          </div>
          <div className="space-y-2">
            {context.invoices.slice(0, 3).map((invoice) => {
              const isOverdue =
                invoice.status !== 'PAID' &&
                invoice.dueDate &&
                new Date(invoice.dueDate) < new Date()

              return (
                <a
                  key={invoice.id}
                  href={`/invoices/${invoice.id}`}
                  className="block p-2 bg-gray-50 hover:bg-gray-100 rounded text-sm transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">
                      {invoice.number || 'Draft'}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 text-xs rounded ${
                        isOverdue ? 'bg-red-100 text-red-700' : getStatusColor(invoice.status)
                      }`}
                    >
                      {isOverdue ? 'OVERDUE' : invoice.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-gray-600">{formatCurrency(invoice.totalAmount)}</p>
                    {invoice.dueDate && (
                      <p className={`text-xs ${isOverdue ? 'text-red-600' : 'text-gray-400'}`}>
                        Due: {new Date(invoice.dueDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </a>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent Tickets */}
      {context.tickets.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TicketIcon className="w-4 h-4 text-gray-400" />
              <h4 className="text-sm font-medium text-gray-900">Recent Tickets</h4>
            </div>
            <a
              href={`/tickets?client=${client.id}`}
              className="text-xs text-blue-600 hover:underline"
            >
              View All
            </a>
          </div>
          <div className="space-y-2">
            {context.tickets.slice(0, 3).map((ticket) => (
              <a
                key={ticket.id}
                href={`/tickets/${ticket.id}`}
                className="block p-2 bg-gray-50 hover:bg-gray-100 rounded text-sm transition-colors"
              >
                <div className="flex items-center gap-2">
                  {getChannelIcon(ticket.channel)}
                  <span className="font-medium text-gray-900 truncate flex-1">
                    {ticket.subject}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span
                    className={`px-1.5 py-0.5 text-xs rounded ${getStatusColor(ticket.status)}`}
                  >
                    {ticket.status}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
