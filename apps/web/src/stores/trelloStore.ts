import { create } from 'zustand'
import type { TrelloBoard, TrelloList, TrelloCard } from '@/lib/trello'

interface TrelloState {
  // Data
  boards: TrelloBoard[]
  selectedBoardId: string | null
  lists: TrelloList[]
  cards: TrelloCard[]

  // UI State
  isLoading: boolean
  error: string | null
  draggedCard: TrelloCard | null

  // Actions
  setBoards: (boards: TrelloBoard[]) => void
  selectBoard: (boardId: string | null) => void
  setLists: (lists: TrelloList[]) => void
  setCards: (cards: TrelloCard[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setDraggedCard: (card: TrelloCard | null) => void

  // Card operations (optimistic updates)
  moveCardOptimistic: (cardId: string, newListId: string) => void
  addCard: (card: TrelloCard) => void
  updateCard: (cardId: string, updates: Partial<TrelloCard>) => void
  removeCard: (cardId: string) => void

  // Computed
  getCardsByList: (listId: string) => TrelloCard[]
  getListById: (listId: string) => TrelloList | undefined
}

export const useTrelloStore = create<TrelloState>((set, get) => ({
  // Initial state
  boards: [],
  selectedBoardId: null,
  lists: [],
  cards: [],
  isLoading: false,
  error: null,
  draggedCard: null,

  // Actions
  setBoards: (boards) => set({ boards }),

  selectBoard: (boardId) => set({ selectedBoardId: boardId, lists: [], cards: [] }),

  setLists: (lists) => set({ lists: lists.filter((l) => !l.closed).sort((a, b) => a.pos - b.pos) }),

  setCards: (cards) => set({ cards: cards.filter((c) => !c.closed) }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  setDraggedCard: (draggedCard) => set({ draggedCard }),

  // Card operations
  moveCardOptimistic: (cardId, newListId) => {
    set((state) => ({
      cards: state.cards.map((card) =>
        card.id === cardId ? { ...card, idList: newListId } : card
      ),
    }))
  },

  addCard: (card) => {
    set((state) => ({
      cards: [...state.cards, card],
    }))
  },

  updateCard: (cardId, updates) => {
    set((state) => ({
      cards: state.cards.map((card) =>
        card.id === cardId ? { ...card, ...updates } : card
      ),
    }))
  },

  removeCard: (cardId) => {
    set((state) => ({
      cards: state.cards.filter((card) => card.id !== cardId),
    }))
  },

  // Computed
  getCardsByList: (listId) => {
    return get()
      .cards.filter((card) => card.idList === listId)
      .sort((a, b) => a.pos - b.pos)
  },

  getListById: (listId) => {
    return get().lists.find((list) => list.id === listId)
  },
}))
