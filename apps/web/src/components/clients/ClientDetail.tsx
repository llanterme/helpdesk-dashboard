'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  PencilIcon,
  TrashIcon,
  TicketIcon,
  DocumentTextIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline'
import { ClientWithStats, useClientStore } from '@/stores/clientStore'
import { ClientForm } from './ClientForm'
import { Modal } from '@/components/ui/Modal'

interface ClientDetailProps {
  clientId: string
}

interface ClientTicket {
  id: string
  subject: string
  status: string
  priority: string
  channel: string
  createdAt: string
  updatedAt: string
  messageCount: number
  lastMessage: string | null
  lastMessageTime: string
  agent?: {
    id: string
    name: string
    email: string
  }
}

interface ClientTicketsResponse {
  client: {
    id: string
    name: string
  }
  tickets: ClientTicket[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  stats: {
    total: number
    byStatus: Record<string, number>
    byChannel: Record<string, number>
  }
}

export function ClientDetail({ clientId }: ClientDetailProps) {
  const router = useRouter()
  const { clients, removeClient } = useClientStore()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Find client in store
  const client = clients.find(c => c.id === clientId)

  // Fetch client tickets
  const { data: ticketsData, isLoading: ticketsLoading } = useQuery<ClientTicketsResponse>({
    queryKey: ['client-tickets', clientId],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${clientId}/tickets`)
      if (!response.ok) {
        throw new Error('Failed to fetch client tickets')
      }
      return response.json()
    },
    enabled: !!clientId
  })

  const handleEditSuccess = (updatedClient: ClientWithStats) => {
    setIsEditModalOpen(false)
    // The client store will be updated by the form component
  }

  const handleDelete = async () => {
    if (!client) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete client')
      }

      removeClient(client.id)
      router.push('/clients')
    } catch (error) {
      console.error('Error deleting client:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete client')
    } finally {
      setIsDeleting(false)
    }
  }

  if (!client) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Client Not Found</h2>
          <p className="text-gray-600 mb-6">The client you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => router.push('/clients')}
            className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700"
          >
            Back to Clients
          </button>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'resolved': return 'bg-blue-100 text-blue-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
          <p className="text-gray-600 mt-1">Client Profile & Activity</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <PencilIcon className="h-4 w-4" />
            Edit
          </button>
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50"
          >
            <TrashIcon className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Client Information */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{client.email}</p>
                </div>
              </div>

              {client.phone && (
                <div className="flex items-center gap-3">
                  <PhoneIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium">{client.phone}</p>
                  </div>
                </div>
              )}

              {client.company && (
                <div className="flex items-center gap-3">
                  <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Company</p>
                    <p className="font-medium">{client.company}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Client Stats */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Activity Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <TicketIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{client.activeTickets}</p>
                  <p className="text-xs text-blue-600">Active Tickets</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <DocumentTextIcon className="h-5 w-5 text-gray-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-600">{client.totalTickets}</p>
                  <p className="text-xs text-gray-600">Total Tickets</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <DocumentTextIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-600">{client.totalQuotes}</p>
                  <p className="text-xs text-green-600">Quotes</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <BanknotesIcon className="h-5 w-5 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-purple-600">{client.totalInvoices}</p>
                  <p className="text-xs text-purple-600">Invoices</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ticket History */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Ticket History</h2>
                {ticketsData?.stats && (
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Total: {ticketsData.stats.total}</span>
                    {Object.entries(ticketsData.stats.byStatus).map(([status, count]) => (
                      <span key={status} className="capitalize">{status}: {count}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6">
              {ticketsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading tickets...</p>
                </div>
              ) : !ticketsData?.tickets?.length ? (
                <div className="text-center py-8">
                  <TicketIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No tickets found for this client</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {ticketsData.tickets.map((ticket) => (
                    <div key={ticket.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-1">{ticket.subject}</h3>
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <span className="capitalize">{ticket.channel.toLowerCase()}</span>
                            <span>•</span>
                            <span>{formatDate(ticket.createdAt)}</span>
                            {ticket.agent && (
                              <>
                                <span>•</span>
                                <span>Assigned to {ticket.agent.name}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                            {ticket.status}
                          </span>
                        </div>
                      </div>

                      {ticket.lastMessage && (
                        <div className="bg-gray-50 rounded-md p-3">
                          <p className="text-sm text-gray-700 line-clamp-2">{ticket.lastMessage}</p>
                          <p className="text-xs text-gray-500 mt-1">{ticket.messageCount} messages</p>
                        </div>
                      )}

                      <div className="flex justify-end mt-3">
                        <button
                          onClick={() => router.push(`/tickets?id=${ticket.id}`)}
                          className="text-sm text-slate-600 hover:text-slate-700 font-medium"
                        >
                          View Ticket →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Client"
        size="lg"
      >
        <ClientForm
          client={client}
          onSuccess={handleEditSuccess}
          onCancel={() => setIsEditModalOpen(false)}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Client"
      >
        <div className="p-6">
          <div className="mb-4">
            <p className="text-gray-700 mb-2">
              Are you sure you want to delete <strong>{client.name}</strong>?
            </p>
            <p className="text-sm text-gray-600">
              This action cannot be undone. The client and all associated data will be permanently removed.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? 'Deleting...' : 'Delete Client'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}