'use client'

import { formatDistanceToNow } from 'date-fns'
import { AgentWithStats, agentUtils } from '@/stores/agentStore'
import {
  EnvelopeIcon,
  PhoneIcon,
  TicketIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

interface AgentItemProps {
  agent: AgentWithStats
  isSelected?: boolean
  onClick: () => void
}

export function AgentItem({ agent, isSelected = false, onClick }: AgentItemProps) {
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

  const getStatusIcon = (status: string) => {
    return status === 'ACTIVE' ? (
      <CheckCircleIcon className="h-4 w-4 text-green-500" />
    ) : (
      <XCircleIcon className="h-4 w-4 text-gray-400" />
    )
  }

  const getPerformanceGrade = () => {
    const resolutionRate = agent.performanceMetrics?.resolutionRate || 0
    return agentUtils.getPerformanceGrade(resolutionRate)
  }

  const performance = getPerformanceGrade()

  return (
    <div
      onClick={onClick}
      className={`p-4 border border-gray-200 rounded-lg cursor-pointer transition-all hover:shadow-md ${
        isSelected
          ? 'border-slate-500 shadow-md bg-slate-50'
          : 'hover:border-gray-300'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Avatar */}
          <div className="relative">
            {agent.avatar && (agent.avatar.startsWith('http') || agent.avatar.startsWith('/')) ? (
              <img
                src={agent.avatar}
                alt={agent.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                style={{ backgroundColor: agent.color || '#64748b' }}
              >
                {agent.name.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Online Status Indicator */}
            <div className="absolute -bottom-0.5 -right-0.5">
              {getStatusIcon(agent.status)}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {agent.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-1 text-xs font-medium border rounded-full ${getRoleBadgeClass(agent.role)}`}>
                {agentUtils.getRoleDisplayName(agent.role)}
              </span>

              {/* Performance Grade */}
              {agent.performanceMetrics && (
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  performance.color === 'green' ? 'bg-green-100 text-green-800' :
                  performance.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                  performance.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  Grade {performance.grade}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Active Tickets Badge */}
        {agent.activeTickets > 0 && (
          <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 flex-shrink-0">
            <TicketIcon className="h-3 w-3 text-red-600" />
            {agent.activeTickets}
          </span>
        )}
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <EnvelopeIcon className="h-4 w-4 flex-shrink-0 text-gray-500" style={{ stroke: 'currentColor', fill: 'none' }} />
          <span className="truncate">{agent.email}</span>
        </div>

        {agent.phone && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <PhoneIcon className="h-4 w-4 flex-shrink-0 text-gray-500" style={{ stroke: 'currentColor', fill: 'none' }} />
            <span>{agent.phone}</span>
          </div>
        )}

        {/* Commission Rate */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <CurrencyDollarIcon className="h-4 w-4 flex-shrink-0 text-gray-500" style={{ stroke: 'currentColor', fill: 'none' }} />
          <span>Commission: {agentUtils.formatCommissionRate(agent.commissionRate)}</span>
        </div>
      </div>

      {/* Performance Metrics */}
      {agent.performanceMetrics && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-center">
              <div className="font-medium text-gray-900">{agent.performanceMetrics.resolutionRate.toFixed(1)}%</div>
              <div className="text-gray-500">Resolution Rate</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-gray-900">{agent.performanceMetrics.avgResponseTime}h</div>
              <div className="text-gray-500">Avg Response</div>
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-100">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mb-1">
            <TicketIcon className="h-3 w-3 text-gray-500" style={{ stroke: 'currentColor', fill: 'none' }} />
            <span>Tickets</span>
          </div>
          <div className="text-sm font-medium text-gray-900">
            {agent.totalTickets}
          </div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mb-1">
            <DocumentTextIcon className="h-3 w-3 text-gray-500" style={{ stroke: 'currentColor', fill: 'none' }} />
            <span>Quotes</span>
          </div>
          <div className="text-sm font-medium text-gray-900">
            {agent.totalQuotes}
          </div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mb-1">
            <CurrencyDollarIcon className="h-3 w-3 text-gray-500" style={{ stroke: 'currentColor', fill: 'none' }} />
            <span>Invoices</span>
          </div>
          <div className="text-sm font-medium text-gray-900">
            {agent.totalInvoices}
          </div>
        </div>
      </div>

      {/* Member Since */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          Member since {formatDistanceToNow(new Date(agent.createdAt), { addSuffix: true })}
        </div>
      </div>
    </div>
  )
}