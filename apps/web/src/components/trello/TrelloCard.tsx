'use client'

import { useState } from 'react'
import {
  CalendarIcon,
  ChatBubbleLeftIcon,
  PaperClipIcon,
  CheckIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'
import type { TrelloCard as TrelloCardType } from '@/lib/trello'

interface TrelloCardProps {
  card: TrelloCardType
  onCardClick?: (card: TrelloCardType) => void
  onDragStart?: (card: TrelloCardType) => void
  onDragEnd?: () => void
  isDragging?: boolean
}

// Label colors from Trello
const labelColors: Record<string, string> = {
  green: 'bg-green-500',
  yellow: 'bg-yellow-400',
  orange: 'bg-orange-500',
  red: 'bg-red-500',
  purple: 'bg-purple-500',
  blue: 'bg-blue-500',
  sky: 'bg-sky-400',
  lime: 'bg-lime-500',
  pink: 'bg-pink-500',
  black: 'bg-gray-800',
}

export function TrelloCard({
  card,
  onCardClick,
  onDragStart,
  onDragEnd,
  isDragging = false,
}: TrelloCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('cardId', card.id)
    e.dataTransfer.effectAllowed = 'move'
    onDragStart?.(card)
  }

  const handleDragEnd = () => {
    onDragEnd?.()
  }

  const formatDueDate = (due: string | null) => {
    if (!due) return null
    const date = new Date(due)
    const now = new Date()
    const isOverdue = date < now && !card.dueComplete
    const isSoon = date.getTime() - now.getTime() < 24 * 60 * 60 * 1000 && !card.dueComplete

    return {
      text: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      isOverdue,
      isSoon,
      isComplete: card.dueComplete,
    }
  }

  const dueInfo = formatDueDate(card.due)

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onCardClick?.(card)}
      className={`
        bg-white rounded-lg shadow-sm border border-gray-200 p-3 cursor-pointer
        transition-all duration-150
        ${isDragging ? 'opacity-50 rotate-2 scale-105' : ''}
        ${isHovered ? 'shadow-md border-gray-300' : ''}
      `}
    >
      {/* Labels */}
      {card.labels && card.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {card.labels.map((label) => (
            <span
              key={label.id}
              className={`h-2 w-10 rounded-sm ${labelColors[label.color || ''] || 'bg-gray-400'}`}
              title={label.name || label.color || ''}
            />
          ))}
        </div>
      )}

      {/* Card Title */}
      <h4 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
        {card.name}
      </h4>

      {/* Card Badges */}
      <div className="flex items-center gap-3 text-xs text-gray-500">
        {/* Due Date */}
        {dueInfo && (
          <span
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${
              dueInfo.isComplete
                ? 'bg-green-100 text-green-700'
                : dueInfo.isOverdue
                ? 'bg-red-100 text-red-700'
                : dueInfo.isSoon
                ? 'bg-yellow-100 text-yellow-700'
                : ''
            }`}
          >
            {dueInfo.isComplete ? (
              <CheckIcon className="h-3 w-3" />
            ) : (
              <CalendarIcon className="h-3 w-3" />
            )}
            {dueInfo.text}
          </span>
        )}

        {/* Description indicator */}
        {card.badges?.description && (
          <span className="flex items-center gap-1" title="Has description">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" />
            </svg>
          </span>
        )}

        {/* Comments */}
        {card.badges?.comments > 0 && (
          <span className="flex items-center gap-1" title={`${card.badges.comments} comment(s)`}>
            <ChatBubbleLeftIcon className="h-3 w-3" />
            {card.badges.comments}
          </span>
        )}

        {/* Attachments */}
        {card.badges?.attachments > 0 && (
          <span className="flex items-center gap-1" title={`${card.badges.attachments} attachment(s)`}>
            <PaperClipIcon className="h-3 w-3" />
            {card.badges.attachments}
          </span>
        )}

        {/* Checklist */}
        {card.badges?.checkItems > 0 && (
          <span
            className={`flex items-center gap-1 ${
              card.badges.checkItemsChecked === card.badges.checkItems
                ? 'text-green-600'
                : ''
            }`}
            title={`${card.badges.checkItemsChecked}/${card.badges.checkItems} checklist items`}
          >
            <CheckIcon className="h-3 w-3" />
            {card.badges.checkItemsChecked}/{card.badges.checkItems}
          </span>
        )}

        {/* Spacer */}
        <span className="flex-1" />

        {/* Members */}
        {card.idMembers && card.idMembers.length > 0 && (
          <div className="flex -space-x-1">
            {card.idMembers.slice(0, 3).map((memberId) => (
              <UserCircleIcon
                key={memberId}
                className="h-5 w-5 text-gray-400 bg-white rounded-full"
              />
            ))}
            {card.idMembers.length > 3 && (
              <span className="flex items-center justify-center h-5 w-5 rounded-full bg-gray-200 text-xs font-medium text-gray-600">
                +{card.idMembers.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
