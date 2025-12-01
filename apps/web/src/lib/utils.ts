import {
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline'
import { TicketChannel, TicketStatus, TicketPriority } from '@helpdesk/database'

// Channel Icon Mapping
export function getChannelIcon(channel: TicketChannel) {
  const icons = {
    WHATSAPP: ChatBubbleLeftRightIcon,
    EMAIL: EnvelopeIcon,
    FORM: DocumentTextIcon,
    CHAT: ChatBubbleLeftIcon,
  }

  return icons[channel] || null
}

// Channel Color Schemes
export function getChannelColor(channel: TicketChannel): string {
  const colors = {
    WHATSAPP: '#10B981', // Green-500
    EMAIL: '#3B82F6',    // Blue-500
    FORM: '#8B5CF6',     // Purple-500
    CHAT: '#F59E0B',     // Amber-500
  }
  return colors[channel] || '#6B7280' // Gray-500 fallback
}

// Status Color Mapping
export function getStatusColor(status: TicketStatus): string {
  const colors = {
    OPEN: '#EF4444',     // Red-500
    PENDING: '#F59E0B',  // Amber-500
    RESOLVED: '#10B981', // Green-500
    CLOSED: '#6B7280',   // Gray-500
  }
  return colors[status] || '#6B7280'
}

// Priority Color Mapping
export function getPriorityColor(priority: TicketPriority): string {
  const colors = {
    LOW: '#6B7280',      // Gray-500
    MEDIUM: '#3B82F6',   // Blue-500
    HIGH: '#F59E0B',     // Amber-500
    URGENT: '#EF4444',   // Red-500
  }
  return colors[priority] || '#6B7280'
}

// Channel Badge Classes
export function getChannelBadgeClass(channel: TicketChannel): string {
  const classes = {
    WHATSAPP: 'bg-green-100 text-green-800',
    EMAIL: 'bg-blue-100 text-blue-800',
    FORM: 'bg-purple-100 text-purple-800',
    CHAT: 'bg-amber-100 text-amber-800',
  }
  return classes[channel] || 'bg-gray-100 text-gray-800'
}

// Status Badge Classes
export function getStatusBadgeClass(status: TicketStatus): string {
  const classes = {
    OPEN: 'bg-red-100 text-red-800',
    PENDING: 'bg-amber-100 text-amber-800',
    RESOLVED: 'bg-green-100 text-green-800',
    CLOSED: 'bg-gray-100 text-gray-800',
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

// Priority Badge Classes
export function getPriorityBadgeClass(priority: TicketPriority): string {
  const classes = {
    LOW: 'bg-gray-100 text-gray-800',
    MEDIUM: 'bg-blue-100 text-blue-800',
    HIGH: 'bg-amber-100 text-amber-800',
    URGENT: 'bg-red-100 text-red-800',
  }
  return classes[priority] || 'bg-gray-100 text-gray-800'
}

// Format status for display
export function formatStatus(status: TicketStatus): string {
  return status.toLowerCase().replace('_', ' ')
}

// Format priority for display
export function formatPriority(priority: TicketPriority): string {
  return priority.toLowerCase()
}

// Format channel for display
export function formatChannel(channel: TicketChannel): string {
  return channel.toLowerCase().replace('_', ' ')
}

// Utility function to combine class names (similar to clsx)
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}