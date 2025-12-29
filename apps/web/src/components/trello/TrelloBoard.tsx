'use client'

import { useEffect, useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowPathIcon,
  Squares2X2Icon,
  ChevronDownIcon,
  PlusIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { Listbox, Transition } from '@headlessui/react'
import { useTrelloStore } from '@/stores/trelloStore'
import { TrelloList } from './TrelloList'
import { TrelloCardModal } from './TrelloCardModal'
import type { TrelloBoard as TrelloBoardType, TrelloCard } from '@/lib/trello'

interface BoardData {
  board: TrelloBoardType
  lists: Array<{ id: string; name: string; closed: boolean; idBoard: string; pos: number }>
  cards: TrelloCard[]
}

export function TrelloBoard() {
  const queryClient = useQueryClient()
  const [selectedCard, setSelectedCard] = useState<TrelloCard | null>(null)
  const [isCardModalOpen, setIsCardModalOpen] = useState(false)

  const {
    boards,
    setBoards,
    selectedBoardId,
    selectBoard,
    lists,
    setLists,
    cards,
    setCards,
    isLoading,
    setLoading,
    error,
    setError,
    draggedCard,
    setDraggedCard,
    moveCardOptimistic,
    addCard,
    getCardsByList,
  } = useTrelloStore()

  // Fetch boards
  const { data: boardsData, isLoading: boardsLoading } = useQuery({
    queryKey: ['trello-boards'],
    queryFn: async () => {
      const res = await fetch('/api/trello/boards')
      if (!res.ok) throw new Error('Failed to fetch boards')
      return res.json() as Promise<TrelloBoardType[]>
    },
    staleTime: 60000,
  })

  // Update store when boards load
  useEffect(() => {
    if (boardsData) {
      setBoards(boardsData)
      // Auto-select first board if none selected
      if (!selectedBoardId && boardsData.length > 0) {
        selectBoard(boardsData[0].id)
      }
    }
  }, [boardsData, selectedBoardId, setBoards, selectBoard])

  // Fetch board data (lists and cards)
  const { data: boardData, isLoading: boardLoading, refetch: refetchBoard } = useQuery({
    queryKey: ['trello-board', selectedBoardId],
    queryFn: async () => {
      if (!selectedBoardId) return null
      const res = await fetch(`/api/trello/boards/${selectedBoardId}?cards=true`)
      if (!res.ok) throw new Error('Failed to fetch board')
      return res.json() as Promise<BoardData>
    },
    enabled: !!selectedBoardId,
    staleTime: 30000,
  })

  // Update store when board data loads
  useEffect(() => {
    if (boardData) {
      setLists(boardData.lists)
      setCards(boardData.cards)
    }
  }, [boardData, setLists, setCards])

  // Move card mutation
  const moveCardMutation = useMutation({
    mutationFn: async ({ cardId, listId }: { cardId: string; listId: string }) => {
      const res = await fetch(`/api/trello/cards/${cardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idList: listId }),
      })
      if (!res.ok) throw new Error('Failed to move card')
      return res.json()
    },
    onMutate: async ({ cardId, listId }) => {
      // Optimistic update
      moveCardOptimistic(cardId, listId)
    },
    onError: () => {
      // Revert on error by refetching
      refetchBoard()
    },
  })

  // Create card mutation
  const createCardMutation = useMutation({
    mutationFn: async ({ listId, name }: { listId: string; name: string }) => {
      const res = await fetch('/api/trello/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, idList: listId }),
      })
      if (!res.ok) throw new Error('Failed to create card')
      return res.json() as Promise<TrelloCard>
    },
    onSuccess: (newCard) => {
      addCard(newCard)
    },
  })

  const handleCardDrop = useCallback(
    (cardId: string, listId: string) => {
      const card = cards.find((c) => c.id === cardId)
      if (card && card.idList !== listId) {
        moveCardMutation.mutate({ cardId, listId })
      }
      setDraggedCard(null)
    },
    [cards, moveCardMutation, setDraggedCard]
  )

  const handleAddCard = useCallback(
    (listId: string, name: string) => {
      createCardMutation.mutate({ listId, name })
    },
    [createCardMutation]
  )

  const handleCardClick = useCallback((card: TrelloCard) => {
    setSelectedCard(card)
    setIsCardModalOpen(true)
  }, [])

  const selectedBoard = boards.find((b) => b.id === selectedBoardId)
  const isLoadingAny = boardsLoading || boardLoading

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-4">
          <Squares2X2Icon className="h-6 w-6 text-slate-600" />
          <h1 className="text-xl font-semibold text-gray-900">Projects</h1>

          {/* Board Selector */}
          <div className="w-64">
            <Listbox value={selectedBoardId} onChange={selectBoard}>
              <div className="relative">
                <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-gray-100 py-2 pl-3 pr-10 text-left text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <span className="block truncate">
                    {selectedBoard?.name || 'Select a board'}
                  </span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                  </span>
                </Listbox.Button>
                <Transition
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    {boards.map((board) => (
                      <Listbox.Option
                        key={board.id}
                        value={board.id}
                        className={({ active }) =>
                          `relative cursor-pointer select-none py-2 px-4 ${
                            active ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
                          }`
                        }
                      >
                        {({ selected }) => (
                          <span className={`block truncate ${selected ? 'font-semibold' : ''}`}>
                            {board.name}
                          </span>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            </Listbox>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetchBoard()}
            disabled={isLoadingAny}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 ${isLoadingAny ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Board Content */}
      <div className="flex-1 overflow-hidden bg-gray-50">
        {isLoadingAny && !lists.length ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <ArrowPathIcon className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Loading board...</p>
            </div>
          </div>
        ) : !selectedBoardId ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Squares2X2Icon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No board selected</h3>
              <p className="text-gray-500">Select a board from the dropdown to view your cards.</p>
            </div>
          </div>
        ) : lists.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <ExclamationTriangleIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No lists found</h3>
              <p className="text-gray-500">This board has no lists. Add lists in Trello to get started.</p>
            </div>
          </div>
        ) : (
          <div className="flex gap-4 p-6 h-full overflow-x-auto">
            {lists.map((list) => (
              <TrelloList
                key={list.id}
                list={list}
                cards={getCardsByList(list.id)}
                onCardClick={handleCardClick}
                onAddCard={handleAddCard}
                onCardDrop={handleCardDrop}
                draggedCard={draggedCard}
                onDragStart={setDraggedCard}
                onDragEnd={() => setDraggedCard(null)}
              />
            ))}

            {/* Add List Button */}
            <div className="flex-shrink-0 w-72">
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors">
                <PlusIcon className="h-4 w-4" />
                Add another list
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Card Modal */}
      <TrelloCardModal
        card={selectedCard}
        isOpen={isCardModalOpen}
        onClose={() => {
          setIsCardModalOpen(false)
          setSelectedCard(null)
        }}
        listName={selectedCard ? lists.find((l) => l.id === selectedCard.idList)?.name : undefined}
      />
    </div>
  )
}
