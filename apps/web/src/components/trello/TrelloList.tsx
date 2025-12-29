'use client'

import { useState } from 'react'
import { PlusIcon, EllipsisHorizontalIcon } from '@heroicons/react/24/outline'
import type { TrelloList as TrelloListType, TrelloCard as TrelloCardType } from '@/lib/trello'
import { TrelloCard } from './TrelloCard'

interface TrelloListProps {
  list: TrelloListType
  cards: TrelloCardType[]
  onCardClick?: (card: TrelloCardType) => void
  onAddCard?: (listId: string, name: string) => void
  onCardDrop?: (cardId: string, listId: string) => void
  draggedCard: TrelloCardType | null
  onDragStart?: (card: TrelloCardType) => void
  onDragEnd?: () => void
}

export function TrelloList({
  list,
  cards,
  onCardClick,
  onAddCard,
  onCardDrop,
  draggedCard,
  onDragStart,
  onDragEnd,
}: TrelloListProps) {
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [newCardName, setNewCardName] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)

  const handleAddCard = () => {
    if (newCardName.trim() && onAddCard) {
      onAddCard(list.id, newCardName.trim())
      setNewCardName('')
      setIsAddingCard(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddCard()
    } else if (e.key === 'Escape') {
      setIsAddingCard(false)
      setNewCardName('')
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const cardId = e.dataTransfer.getData('cardId')
    if (cardId && onCardDrop) {
      onCardDrop(cardId, list.id)
    }
  }

  return (
    <div
      className={`
        flex-shrink-0 w-72 bg-gray-100 rounded-lg flex flex-col max-h-full
        transition-colors duration-150
        ${isDragOver ? 'bg-blue-50 ring-2 ring-blue-300' : ''}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* List Header */}
      <div className="flex items-center justify-between px-3 py-2 font-semibold text-gray-700">
        <h3 className="text-sm truncate flex-1">{list.name}</h3>
        <span className="text-xs text-gray-500 mx-2">{cards.length}</span>
        <button className="p-1 hover:bg-gray-200 rounded transition-colors">
          <EllipsisHorizontalIcon className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      {/* Cards Container */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-2 min-h-[50px]">
        {cards.map((card) => (
          <TrelloCard
            key={card.id}
            card={card}
            onCardClick={onCardClick}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            isDragging={draggedCard?.id === card.id}
          />
        ))}

        {/* Drop indicator when list is empty or dragging */}
        {isDragOver && cards.length === 0 && (
          <div className="h-20 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50 flex items-center justify-center">
            <span className="text-sm text-blue-500">Drop here</span>
          </div>
        )}
      </div>

      {/* Add Card */}
      <div className="px-2 pb-2">
        {isAddingCard ? (
          <div className="space-y-2">
            <textarea
              value={newCardName}
              onChange={(e) => setNewCardName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter a title for this card..."
              className="w-full p-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              autoFocus
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddCard}
                disabled={!newCardName.trim()}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add card
              </button>
              <button
                onClick={() => {
                  setIsAddingCard(false)
                  setNewCardName('')
                }}
                className="px-3 py-1.5 text-gray-600 text-sm hover:bg-gray-200 rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingCard(true)}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Add a card
          </button>
        )}
      </div>
    </div>
  )
}
