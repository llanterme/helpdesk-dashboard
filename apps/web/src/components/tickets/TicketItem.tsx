'use client'

import { formatDistanceToNow } from 'date-fns'
import { TicketWithRelations } from '@/stores/ticketStore'
import {
  getChannelIcon,
  getChannelColor,
  getStatusColor,
  getPriorityColor,
  formatStatus,
  formatPriority
} from '@/lib/utils'

interface TicketItemProps {
  ticket: TicketWithRelations
  isSelected: boolean
  onClick: () => void
}

export function TicketItem({ ticket, isSelected, onClick }: TicketItemProps) {
  return (
    <div
      onClick={onClick}
      className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
        isSelected
          ? 'bg-slate-50 border-l-4 border-l-slate-800'
          : 'hover:bg-gray-50'
      } ${ticket.unread ? 'bg-amber-50' : ''}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span style={{ color: getChannelColor(ticket.channel) }}>
          {(() => {
            const IconComponent = getChannelIcon(ticket.channel)
            return IconComponent ? <IconComponent className="w-4 h-4" /> : null
          })()}
        </span>
        <span className="text-xs text-gray-400">{ticket.id.slice(0, 8)}</span>
        <span className="ml-auto text-xs text-gray-400">
          {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
        </span>
      </div>

      <h4 className={`text-sm mb-1 truncate ${ticket.unread ? 'font-semibold' : ''}`}>
        {ticket.subject}
      </h4>

      <p className="text-sm text-gray-500 mb-2">{ticket.client.name}</p>

      <div className="flex items-center gap-2">
        <span
          className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
          style={{ backgroundColor: getStatusColor(ticket.status) }}
        >
          {formatStatus(ticket.status)}
        </span>

        <span
          className="text-xs font-medium"
          style={{ color: getPriorityColor(ticket.priority) }}
        >
          {formatPriority(ticket.priority)}
        </span>

        {ticket.agent && (
          <span className="ml-auto flex items-center gap-1 text-xs text-gray-500">
            <span
              className={`w-5 h-5 text-white rounded-full flex items-center justify-center text-[10px] font-medium`}
              style={{ backgroundColor: ticket.agent.color || '#6B7280' }}
            >
              {ticket.agent.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </span>
          </span>
        )}
      </div>
    </div>
  )
}