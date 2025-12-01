'use client'

import { useState } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { ChevronUpDownIcon, CheckIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useTicketStore } from '@/stores/ticketStore'
import { TicketChannel, TicketStatus } from '@helpdesk/database'
import { formatChannel, formatStatus } from '@/lib/utils'

const channelOptions = [
  { value: 'all' as const, label: 'All Channels' },
  { value: 'WHATSAPP' as TicketChannel, label: 'WhatsApp' },
  { value: 'EMAIL' as TicketChannel, label: 'Email' },
  { value: 'FORM' as TicketChannel, label: 'Form' },
  { value: 'CHAT' as TicketChannel, label: 'Chat' },
]

const statusOptions = [
  { value: 'all' as const, label: 'All Status' },
  { value: 'OPEN' as TicketStatus, label: 'Open' },
  { value: 'PENDING' as TicketStatus, label: 'Pending' },
  { value: 'RESOLVED' as TicketStatus, label: 'Resolved' },
  { value: 'CLOSED' as TicketStatus, label: 'Closed' },
]

export function TicketFilters() {
  const { filters, setFilters } = useTicketStore()

  const selectedChannelOption = channelOptions.find(option => option.value === filters.channel) || channelOptions[0]
  const selectedStatusOption = statusOptions.find(option => option.value === filters.status) || statusOptions[0]

  return (
    <div className="p-4 border-b border-gray-200 bg-white">
      {/* Search */}
      <div className="relative mb-3">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search tickets..."
          value={filters.search}
          onChange={(e) => setFilters({ search: e.target.value })}
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm"
        />
      </div>

      {/* Filters */}
      <div className="space-y-2">
        {/* Channel Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Channel</label>
          <Listbox
            value={selectedChannelOption}
            onChange={(option) => setFilters({ channel: option.value })}
          >
            <div className="relative">
              <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-1.5 pl-3 pr-10 text-left shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 text-sm">
                <span className="block truncate">{selectedChannelOption.label}</span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronUpDownIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
                </span>
              </Listbox.Button>

              <Transition
                as="div"
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  {channelOptions.map((option) => (
                    <Listbox.Option
                      key={option.value}
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-8 pr-4 ${
                          active ? 'bg-slate-100 text-slate-900' : 'text-gray-900'
                        }`
                      }
                      value={option}
                    >
                      {({ selected }) => (
                        <>
                          <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                            {option.label}
                          </span>
                          {selected ? (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-slate-600">
                              <CheckIcon className="h-4 w-4" aria-hidden="true" />
                            </span>
                          ) : null}
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          </Listbox>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
          <Listbox
            value={selectedStatusOption}
            onChange={(option) => setFilters({ status: option.value })}
          >
            <div className="relative">
              <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-1.5 pl-3 pr-10 text-left shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 text-sm">
                <span className="block truncate">{selectedStatusOption.label}</span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronUpDownIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
                </span>
              </Listbox.Button>

              <Transition
                as="div"
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  {statusOptions.map((option) => (
                    <Listbox.Option
                      key={option.value}
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-8 pr-4 ${
                          active ? 'bg-slate-100 text-slate-900' : 'text-gray-900'
                        }`
                      }
                      value={option}
                    >
                      {({ selected }) => (
                        <>
                          <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                            {option.label}
                          </span>
                          {selected ? (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-slate-600">
                              <CheckIcon className="h-4 w-4" aria-hidden="true" />
                            </span>
                          ) : null}
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
  )
}