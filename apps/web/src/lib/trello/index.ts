/**
 * Trello Integration
 *
 * Export all Trello services and types
 */

// Config
export { getTrelloConfig, isTrelloConfigured, TRELLO_BASE_URL } from './config'
export type { TrelloConfig } from './config'

// Client
export { getTrelloClient, TrelloClient } from './client'
export type { TrelloApiError } from './client'

// Types
export type {
  TrelloBoard,
  TrelloBoardPrefs,
  TrelloList,
  TrelloCard,
  TrelloCardBadges,
  TrelloLabel,
  TrelloLabelColor,
  TrelloMember,
  TrelloAttachment,
  TrelloChecklist,
  TrelloCheckItem,
  TrelloAction,
  TrelloWebhook,
  TrelloWebhookPayload,
  CreateCardDto,
  UpdateCardDto,
  CreateListDto,
  CreateBoardDto,
} from './types'

// Board operations
export {
  getBoards,
  getBoard,
  createBoard,
  getBoardLists,
  createList,
  updateList,
  archiveList,
  getBoardMembers,
  getBoardLabels,
} from './boards'

// Card operations
export {
  getBoardCards,
  getListCards,
  getCard,
  createCard,
  updateCard,
  moveCard,
  archiveCard,
  deleteCard,
  getCardActions,
  addCardComment,
  getCardChecklists,
  createChecklist,
  addChecklistItem,
  getCardAttachments,
  addCardAttachment,
  addCardMember,
  removeCardMember,
  addCardLabel,
  removeCardLabel,
} from './cards'
