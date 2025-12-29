'use client'

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  XMarkIcon,
  CalendarIcon,
  UserCircleIcon,
  TagIcon,
  PaperClipIcon,
  ChatBubbleLeftIcon,
  CheckIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline'
import type { TrelloCard } from '@/lib/trello'

interface TrelloCardModalProps {
  card: TrelloCard | null
  isOpen: boolean
  onClose: () => void
  listName?: string
}

// Label colors from Trello
const labelColors: Record<string, { bg: string; text: string }> = {
  green: { bg: 'bg-green-500', text: 'text-white' },
  yellow: { bg: 'bg-yellow-400', text: 'text-gray-900' },
  orange: { bg: 'bg-orange-500', text: 'text-white' },
  red: { bg: 'bg-red-500', text: 'text-white' },
  purple: { bg: 'bg-purple-500', text: 'text-white' },
  blue: { bg: 'bg-blue-500', text: 'text-white' },
  sky: { bg: 'bg-sky-400', text: 'text-white' },
  lime: { bg: 'bg-lime-500', text: 'text-gray-900' },
  pink: { bg: 'bg-pink-500', text: 'text-white' },
  black: { bg: 'bg-gray-800', text: 'text-white' },
}

export function TrelloCardModal({ card, isOpen, onClose, listName }: TrelloCardModalProps) {
  if (!card) return null

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const dueDate = formatDate(card.due)
  const isOverdue = card.due && new Date(card.due) < new Date() && !card.dueComplete

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-start justify-center p-4 pt-20">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-lg bg-gray-100 shadow-xl transition-all">
                {/* Header */}
                <div className="bg-white px-6 py-4 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-8">
                      <Dialog.Title className="text-lg font-semibold text-gray-900">
                        {card.name}
                      </Dialog.Title>
                      {listName && (
                        <p className="text-sm text-gray-500 mt-1">
                          in list <span className="font-medium">{listName}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={card.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title="Open in Trello"
                      >
                        <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                      </a>
                      <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                  {/* Labels */}
                  {card.labels && card.labels.length > 0 && (
                    <div>
                      <h4 className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <TagIcon className="h-4 w-4" />
                        Labels
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {card.labels.map((label) => {
                          const colors = labelColors[label.color || ''] || { bg: 'bg-gray-400', text: 'text-white' }
                          return (
                            <span
                              key={label.id}
                              className={`px-3 py-1 rounded text-sm font-medium ${colors.bg} ${colors.text}`}
                            >
                              {label.name || label.color}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Due Date */}
                  {dueDate && (
                    <div>
                      <h4 className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <CalendarIcon className="h-4 w-4" />
                        Due Date
                      </h4>
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded text-sm ${
                          card.dueComplete
                            ? 'bg-green-100 text-green-700'
                            : isOverdue
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {card.dueComplete && <CheckIcon className="h-4 w-4" />}
                        {dueDate}
                        {card.dueComplete && <span className="text-xs">(Complete)</span>}
                        {isOverdue && <span className="text-xs">(Overdue)</span>}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {card.desc && (
                    <div>
                      <h4 className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" />
                        </svg>
                        Description
                      </h4>
                      <div className="bg-white rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">
                        {card.desc}
                      </div>
                    </div>
                  )}

                  {/* Checklist Progress */}
                  {card.badges?.checkItems > 0 && (
                    <div>
                      <h4 className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <CheckIcon className="h-4 w-4" />
                        Checklist
                      </h4>
                      <div className="bg-white rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                card.badges.checkItemsChecked === card.badges.checkItems
                                  ? 'bg-green-500'
                                  : 'bg-blue-500'
                              }`}
                              style={{
                                width: `${(card.badges.checkItemsChecked / card.badges.checkItems) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">
                            {card.badges.checkItemsChecked}/{card.badges.checkItems}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-6 pt-4 border-t border-gray-200">
                    {card.badges?.comments > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <ChatBubbleLeftIcon className="h-4 w-4" />
                        {card.badges.comments} comment{card.badges.comments !== 1 ? 's' : ''}
                      </div>
                    )}
                    {card.badges?.attachments > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <PaperClipIcon className="h-4 w-4" />
                        {card.badges.attachments} attachment{card.badges.attachments !== 1 ? 's' : ''}
                      </div>
                    )}
                    {card.idMembers && card.idMembers.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <UserCircleIcon className="h-4 w-4" />
                        {card.idMembers.length} member{card.idMembers.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>

                  {/* Last Activity */}
                  <div className="text-xs text-gray-400">
                    Last activity: {formatDate(card.dateLastActivity)}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
