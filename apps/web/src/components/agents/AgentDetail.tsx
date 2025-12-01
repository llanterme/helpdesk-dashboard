'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  EnvelopeIcon,
  PhoneIcon,
  TicketIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { AgentWithStats, useAgentStore, agentUtils } from '@/stores/agentStore'
import { AgentForm } from './AgentForm'
import { Modal } from '@/components/ui/Modal'

interface AgentDetailProps {
  agentId: string
}

interface AgentStats {
  agent: {
    id: string
    name: string
    email: string
    role: string
  }
  period: {
    days: number
    start: string
    end: string
  }
  tickets: {
    total: number
    period: number
    resolved: number
    resolutionRate: number
    avgResolutionTime: number
    byStatus: Record<string, number>
  }
  quotes: {
    total: number
    period: number
    accepted: number
    acceptanceRate: number
  }
  invoices: {
    total: number
    period: number
    paid: number
    revenue: number
  }
  commission: {
    revenue: number
    rate: number
    commission: number
  }
  activity: {
    daily: Array<{ date: string; tickets: number }>
    byChannel: Record<string, number>
    byPriority: Record<string, number>
  }
}

export function AgentDetail({ agentId }: AgentDetailProps) {
  const router = useRouter()
  const { agents, removeAgent, updateAgent } = useAgentStore()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState('30')

  // Find agent in store
  const agent = agents.find(a => a.id === agentId)

  // Fetch detailed agent statistics
  const { data: statsData, isLoading: statsLoading } = useQuery<AgentStats>({
    queryKey: ['agent-stats', agentId, selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/agents/${agentId}/stats?period=${selectedPeriod}`)
      if (!response.ok) {
        throw new Error('Failed to fetch agent statistics')
      }
      return response.json()
    },
    enabled: !!agentId
  })

  const handleEditSuccess = (updatedAgent: AgentWithStats) => {
    setIsEditModalOpen(false)
    // The agent store will be updated by the form component
  }

  const handleStatusToggle = async () => {
    if (!agent) return

    const newStatus = agent.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'

    try {
      const response = await fetch(`/api/agents/${agent.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update agent status')
      }

      updateAgent(agent.id, { status: newStatus })
    } catch (error) {
      console.error('Error updating agent status:', error)
      alert(error instanceof Error ? error.message : 'Failed to update agent status')
    }
  }

  const handleDelete = async () => {
    if (!agent) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/agents/${agent.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete agent')
      }

      removeAgent(agent.id)
      router.push('/agents')
    } catch (error) {
      console.error('Error deleting agent:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete agent')
    } finally {
      setIsDeleting(false)
    }
  }

  if (!agent) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Agent Not Found</h2>
          <p className="text-gray-600 mb-6">The agent you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => router.push('/agents')}
            className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700"
          >
            Back to Agents
          </button>
        </div>
      </div>
    )
  }

  const getStatusIcon = (status: string) => {
    return status === 'ACTIVE' ? (
      <CheckCircleIcon className="h-5 w-5 text-green-500" />
    ) : (
      <XCircleIcon className="h-5 w-5 text-gray-400" />
    )
  }

  const getRoleBadgeClass = (role: string) => {
    const colors = agentUtils.getRoleColor(role as any)
    const colorClasses = {
      red: 'bg-red-100 text-red-800 border-red-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return colorClasses[colors as keyof typeof colorClasses] || colorClasses.gray
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative">
            {agent.avatar ? (
              <img
                src={agent.avatar}
                alt={agent.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white font-medium text-xl"
                style={{ backgroundColor: agent.color || '#64748b' }}
              >
                {agent.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1">
              {getStatusIcon(agent.status)}
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-bold text-gray-900">{agent.name}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className={`px-3 py-1 text-sm font-medium border rounded-full ${getRoleBadgeClass(agent.role)}`}>
                {agentUtils.getRoleDisplayName(agent.role)}
              </span>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                agent.status === 'ACTIVE'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {agentUtils.getStatusDisplayName(agent.status)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleStatusToggle}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-md ${
              agent.status === 'ACTIVE'
                ? 'text-red-700 border-red-300 hover:bg-red-50'
                : 'text-green-700 border-green-300 hover:bg-green-50'
            }`}
          >
            {agent.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          </button>

          <button
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <PencilIcon className="h-4 w-4" />
            Edit
          </button>

          {agentUtils.canDeleteAgent(agent) && (
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50"
            >
              <TrashIcon className="h-4 w-4" />
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Agent Information */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{agent.email}</p>
                </div>
              </div>

              {agent.phone && (
                <div className="flex items-center gap-3">
                  <PhoneIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium">{agent.phone}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Commission Rate</p>
                  <p className="font-medium">{agentUtils.formatCommissionRate(agent.commissionRate)}</p>
                </div>
              </div>
            </div>

            {/* Performance Summary */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Performance Overview</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <TicketIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{agent.activeTickets}</p>
                  <p className="text-xs text-blue-600">Active Tickets</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <DocumentTextIcon className="h-5 w-5 text-gray-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-600">{agent.totalTickets}</p>
                  <p className="text-xs text-gray-600">Total Tickets</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <DocumentTextIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-600">{agent.totalQuotes}</p>
                  <p className="text-xs text-green-600">Quotes</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <CurrencyDollarIcon className="h-5 w-5 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-purple-600">{agent.totalInvoices}</p>
                  <p className="text-xs text-purple-600">Invoices</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <ChartBarIcon className="h-5 w-5" />
                  Performance Metrics
                </h2>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                </select>
              </div>
            </div>

            <div className="p-6">
              {statsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading performance data...</p>
                </div>
              ) : statsData ? (
                <div className="space-y-6">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{statsData.tickets.resolutionRate.toFixed(1)}%</div>
                      <div className="text-sm text-blue-600">Resolution Rate</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{statsData.tickets.avgResolutionTime}h</div>
                      <div className="text-sm text-green-600">Avg Response</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{statsData.quotes.acceptanceRate.toFixed(1)}%</div>
                      <div className="text-sm text-purple-600">Quote Acceptance</div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">${statsData.commission.commission.toFixed(2)}</div>
                      <div className="text-sm text-yellow-600">Commission Earned</div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  {agent.recentActivity && agent.recentActivity.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                      <div className="space-y-3">
                        {agent.recentActivity.slice(0, 5).map((activity, index) => (
                          <div key={activity.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{activity.subject}</p>
                              <p className="text-sm text-gray-600">Client: {activity.clientName}</p>
                            </div>
                            <div className="text-right">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                activity.status === 'RESOLVED' ? 'bg-green-100 text-green-800' :
                                activity.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                activity.status === 'OPEN' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {activity.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">No performance data available</p>
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
        title="Edit Agent"
        size="lg"
      >
        <AgentForm
          agent={agent}
          onSuccess={handleEditSuccess}
          onCancel={() => setIsEditModalOpen(false)}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Agent"
      >
        <div className="p-6">
          <div className="mb-4">
            <p className="text-gray-700 mb-2">
              Are you sure you want to delete <strong>{agent.name}</strong>?
            </p>
            <p className="text-sm text-gray-600">
              This action cannot be undone. The agent and all associated data will be permanently removed.
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
              {isDeleting ? 'Deleting...' : 'Delete Agent'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}