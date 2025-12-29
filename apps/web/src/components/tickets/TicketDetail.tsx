'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Listbox, Transition } from '@headlessui/react'
import { ChevronUpDownIcon, CheckIcon, EnvelopeIcon, PhoneIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'
import { useTicketStore, TicketWithRelations } from '@/stores/ticketStore'
import { useAgentStore } from '@/stores/agentStore'
import { TicketStatus, TicketPriority } from '@helpdesk/database'
import {
  getChannelIcon,
  getChannelColor,
  getStatusBadgeClass,
  getPriorityBadgeClass,
  formatStatus,
  formatPriority,
  formatChannel
} from '@/lib/utils'
import { MessageThread } from '@/components/messages/MessageThread'
import { MessageComposer } from '@/components/messages/MessageComposer'
import { EmailComposer } from '@/components/email/EmailComposer'

const statusOptions = [
  { value: 'OPEN' as TicketStatus, label: 'Open' },
  { value: 'PENDING' as TicketStatus, label: 'Pending' },
  { value: 'RESOLVED' as TicketStatus, label: 'Resolved' },
  { value: 'CLOSED' as TicketStatus, label: 'Closed' },
]

const priorityOptions = [
  { value: 'LOW' as TicketPriority, label: 'Low' },
  { value: 'MEDIUM' as TicketPriority, label: 'Medium' },
  { value: 'HIGH' as TicketPriority, label: 'High' },
  { value: 'URGENT' as TicketPriority, label: 'Urgent' },
]

interface TicketDetailProps {
  ticket?: TicketWithRelations
}

export function TicketDetail({ ticket }: TicketDetailProps) {
  const { updateTicket } = useTicketStore()
  const { agents } = useAgentStore()
  const [isUpdating, setIsUpdating] = useState(false)
  const [showEmailComposer, setShowEmailComposer] = useState(false)

  if (!ticket) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <p className="text-lg">Select a ticket to view details</p>
          <p className="text-sm mt-1">Choose a ticket from the list to see the full conversation</p>
        </div>
      </div>
    )
  }

  const selectedStatusOption = statusOptions.find(option => option.value === ticket.status) || statusOptions[0]
  const selectedPriorityOption = priorityOptions.find(option => option.value === ticket.priority) || priorityOptions[0]

  // Agent options for assignment
  const agentOptions = [
    { id: null, name: 'Unassigned', role: 'UNASSIGNED' as const },
    ...agents.filter(agent => agent.status === 'ACTIVE')
  ]
  const selectedAgent = agentOptions.find(agent => agent.id === ticket.agentId) || agentOptions[0]

  const handleStatusChange = async (newStatus: TicketStatus) => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        updateTicket(ticket.id, { status: newStatus })
      }
    } catch (error) {
      console.error('Error updating ticket status:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handlePriorityChange = async (newPriority: TicketPriority) => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priority: newPriority }),
      })

      if (response.ok) {
        updateTicket(ticket.id, { priority: newPriority })
      }
    } catch (error) {
      console.error('Error updating ticket priority:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleAgentAssignment = async (agent: typeof selectedAgent) => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ agentId: agent.id }),
      })

      if (response.ok) {
        updateTicket(ticket.id, { agentId: agent.id })
      }
    } catch (error) {
      console.error('Error assigning ticket:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="flex-1 flex">
      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span style={{ color: getChannelColor(ticket.channel) }}>
                {(() => {
                  const IconComponent = getChannelIcon(ticket.channel)
                  return IconComponent ? <IconComponent className="w-5 h-5" /> : null
                })()}
              </span>
              <h1 className="text-xl font-semibold text-gray-900">{ticket.subject}</h1>
            </div>
            <span className="text-sm text-gray-500">#{ticket.id.slice(0, 8)}</span>
          </div>

          <div className="flex items-center gap-4">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(ticket.status)}`}>
              {formatStatus(ticket.status)}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadgeClass(ticket.priority)}`}>
              {formatPriority(ticket.priority)} priority
            </span>
            <span className="text-sm text-gray-500">
              via {formatChannel(ticket.channel)}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-4">
            {/* Status Control */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <Listbox
                value={selectedStatusOption}
                onChange={(option) => handleStatusChange(option.value)}
                disabled={isUpdating}
              >
                <div className="relative">
                  <Listbox.Button className="relative w-32 cursor-default rounded-md border border-gray-300 bg-white py-1.5 pl-3 pr-8 text-left shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 text-sm">
                    <span className="block truncate">{selectedStatusOption.label}</span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <ChevronUpDownIcon className="h-4 w-4 text-gray-400" />
                    </span>
                  </Listbox.Button>

                  <Transition
                    as="div"
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5">
                      {statusOptions.map((option) => (
                        <Listbox.Option
                          key={option.value}
                          className={({ active }) =>
                            `relative cursor-default select-none py-2 pl-8 pr-4 ${
                              active ? 'bg-slate-100' : ''
                            }`
                          }
                          value={option}
                        >
                          {({ selected }) => (
                            <>
                              <span className={`block truncate ${selected ? 'font-medium' : ''}`}>
                                {option.label}
                              </span>
                              {selected && (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-slate-600">
                                  <CheckIcon className="h-4 w-4" />
                                </span>
                              )}
                            </>
                          )}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Transition>
                </div>
              </Listbox>
            </div>

            {/* Priority Control */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
              <Listbox
                value={selectedPriorityOption}
                onChange={(option) => handlePriorityChange(option.value)}
                disabled={isUpdating}
              >
                <div className="relative">
                  <Listbox.Button className="relative w-32 cursor-default rounded-md border border-gray-300 bg-white py-1.5 pl-3 pr-8 text-left shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 text-sm">
                    <span className="block truncate">{selectedPriorityOption.label}</span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <ChevronUpDownIcon className="h-4 w-4 text-gray-400" />
                    </span>
                  </Listbox.Button>

                  <Transition
                    as="div"
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5">
                      {priorityOptions.map((option) => (
                        <Listbox.Option
                          key={option.value}
                          className={({ active }) =>
                            `relative cursor-default select-none py-2 pl-8 pr-4 ${
                              active ? 'bg-slate-100' : ''
                            }`
                          }
                          value={option}
                        >
                          {({ selected }) => (
                            <>
                              <span className={`block truncate ${selected ? 'font-medium' : ''}`}>
                                {option.label}
                              </span>
                              {selected && (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-slate-600">
                                  <CheckIcon className="h-4 w-4" />
                                </span>
                              )}
                            </>
                          )}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Transition>
                </div>
              </Listbox>
            </div>

            {/* Agent Assignment Control */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Assigned to</label>
              <Listbox
                value={selectedAgent}
                onChange={(agent) => handleAgentAssignment(agent)}
                disabled={isUpdating}
              >
                <div className="relative">
                  <Listbox.Button className="relative w-40 cursor-default rounded-md border border-gray-300 bg-white py-1.5 pl-3 pr-8 text-left shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 text-sm">
                    <div className="flex items-center gap-2">
                      {selectedAgent.id ? (
                        <>
                          <span
                            className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-medium text-white"
                            style={{ backgroundColor: selectedAgent.color || '#6B7280' }}
                          >
                            {selectedAgent.name.split(' ').map(n => n[0]).join('').slice(0, 1)}
                          </span>
                          <span className="block truncate">{selectedAgent.name}</span>
                        </>
                      ) : (
                        <span className="block truncate text-gray-500">Unassigned</span>
                      )}
                    </div>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <ChevronUpDownIcon className="h-4 w-4 text-gray-400" />
                    </span>
                  </Listbox.Button>

                  <Transition
                    as="div"
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5">
                      {agentOptions.map((agent) => (
                        <Listbox.Option
                          key={agent.id || 'unassigned'}
                          className={({ active }) =>
                            `relative cursor-default select-none py-2 pl-8 pr-4 ${
                              active ? 'bg-slate-100' : ''
                            }`
                          }
                          value={agent}
                        >
                          {({ selected }) => (
                            <>
                              <div className="flex items-center gap-2">
                                {agent.id ? (
                                  <>
                                    <span
                                      className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-medium text-white"
                                      style={{ backgroundColor: agent.color || '#6B7280' }}
                                    >
                                      {agent.name.split(' ').map(n => n[0]).join('').slice(0, 1)}
                                    </span>
                                    <span className={`block truncate ${selected ? 'font-medium' : ''}`}>
                                      {agent.name}
                                    </span>
                                  </>
                                ) : (
                                  <span className={`block truncate text-gray-500 ${selected ? 'font-medium' : ''}`}>
                                    Unassigned
                                  </span>
                                )}
                              </div>
                              {selected && (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-slate-600">
                                  <CheckIcon className="h-4 w-4" />
                                </span>
                              )}
                            </>
                          )}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Transition>
                </div>
              </Listbox>
            </div>
          </div>
        </div>

        {/* Message Thread */}
        <MessageThread
          ticketId={ticket.id}
          className="flex-1"
        />

        {/* Message Composer - with Email Reply option for EMAIL channel */}
        <div className="border-t border-gray-200">
          {ticket.channel === 'EMAIL' && (
            <div className="px-4 py-2 bg-blue-50 flex items-center justify-between">
              <span className="text-sm text-blue-700">
                This is an email ticket. You can reply via email or internal note.
              </span>
              <button
                onClick={() => setShowEmailComposer(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                <PaperAirplaneIcon className="w-4 h-4" />
                Reply via Email
              </button>
            </div>
          )}
          <MessageComposer
            ticketId={ticket.id}
            placeholder={ticket.channel === 'EMAIL' ? `Add internal note for ${ticket.client.name}...` : `Reply to ${ticket.client.name}...`}
          />
        </div>

        {/* Email Composer Modal */}
        {showEmailComposer && (
          <EmailComposer
            mode="reply"
            ticketId={ticket.id}
            clientEmail={ticket.client.email}
            subject={ticket.subject}
            onClose={() => setShowEmailComposer(false)}
            onSent={() => {
              setShowEmailComposer(false)
              // Refresh messages
              window.location.reload()
            }}
          />
        )}
      </div>

      {/* Client Sidebar */}
      <div className="w-80 bg-gray-50 border-l border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Client Information</h3>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700">Name</h4>
            <p className="text-sm text-gray-900 mt-1">{ticket.client.name}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700">Email</h4>
            <div className="flex items-center gap-2 mt-1">
              <EnvelopeIcon className="h-4 w-4 text-gray-400" />
              <a
                href={`mailto:${ticket.client.email}`}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {ticket.client.email}
              </a>
            </div>
          </div>

          {ticket.client.phone && (
            <div>
              <h4 className="text-sm font-medium text-gray-700">Phone</h4>
              <div className="flex items-center gap-2 mt-1">
                <PhoneIcon className="h-4 w-4 text-gray-400" />
                <a
                  href={`tel:${ticket.client.phone}`}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {ticket.client.phone}
                </a>
              </div>
            </div>
          )}

          {ticket.client.company && (
            <div>
              <h4 className="text-sm font-medium text-gray-700">Company</h4>
              <p className="text-sm text-gray-900 mt-1">{ticket.client.company}</p>
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium text-gray-700">Created</h4>
            <p className="text-sm text-gray-900 mt-1">
              {format(new Date(ticket.createdAt), 'MMM d, yyyy h:mm a')}
            </p>
          </div>

          {ticket.agent && (
            <div>
              <h4 className="text-sm font-medium text-gray-700">Assigned Agent</h4>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="w-6 h-6 text-white rounded-full flex items-center justify-center text-xs font-medium"
                  style={{ backgroundColor: ticket.agent.color || '#6B7280' }}
                >
                  {ticket.agent.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </span>
                <span className="text-sm text-gray-900">{ticket.agent.name}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}