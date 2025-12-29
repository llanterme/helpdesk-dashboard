/**
 * Trello Cards Service
 *
 * Operations for cards (create, read, update, delete, move)
 */

import { getTrelloClient } from './client'
import type {
  TrelloCard,
  TrelloAction,
  TrelloChecklist,
  TrelloAttachment,
  CreateCardDto,
  UpdateCardDto,
} from './types'

/**
 * Get all cards on a board
 */
export async function getBoardCards(boardId: string): Promise<TrelloCard[]> {
  const client = getTrelloClient()
  return client.get<TrelloCard[]>(`/boards/${boardId}/cards`, {
    fields: 'id,name,desc,closed,idBoard,idList,pos,due,dueComplete,idMembers,idLabels,url,shortUrl,dateLastActivity,idChecklists,badges',
    attachments: 'true',
    members: 'true',
    labels: 'all',
  })
}

/**
 * Get all cards in a list
 */
export async function getListCards(listId: string): Promise<TrelloCard[]> {
  const client = getTrelloClient()
  return client.get<TrelloCard[]>(`/lists/${listId}/cards`, {
    fields: 'id,name,desc,closed,idBoard,idList,pos,due,dueComplete,idMembers,idLabels,url,shortUrl,dateLastActivity,idChecklists,badges',
    attachments: 'true',
    labels: 'all',
  })
}

/**
 * Get a specific card by ID
 */
export async function getCard(cardId: string): Promise<TrelloCard> {
  const client = getTrelloClient()
  return client.get<TrelloCard>(`/cards/${cardId}`, {
    fields: 'id,name,desc,closed,idBoard,idList,pos,due,dueComplete,idMembers,idLabels,url,shortUrl,dateLastActivity,idChecklists,badges',
    attachments: 'true',
    labels: 'all',
    members: 'true',
  })
}

/**
 * Create a new card
 */
export async function createCard(data: CreateCardDto): Promise<TrelloCard> {
  const client = getTrelloClient()
  const params: Record<string, string> = {
    name: data.name,
    idList: data.idList,
  }

  if (data.desc) params.desc = data.desc
  if (data.pos) params.pos = String(data.pos)
  if (data.due) params.due = data.due
  if (data.idMembers?.length) params.idMembers = data.idMembers.join(',')
  if (data.idLabels?.length) params.idLabels = data.idLabels.join(',')

  return client.post<TrelloCard>('/cards', undefined, params)
}

/**
 * Update a card
 */
export async function updateCard(
  cardId: string,
  data: UpdateCardDto
): Promise<TrelloCard> {
  const client = getTrelloClient()
  const params: Record<string, string> = {}

  if (data.name !== undefined) params.name = data.name
  if (data.desc !== undefined) params.desc = data.desc
  if (data.idList !== undefined) params.idList = data.idList
  if (data.pos !== undefined) params.pos = String(data.pos)
  if (data.due !== undefined) params.due = data.due || ''
  if (data.dueComplete !== undefined) params.dueComplete = String(data.dueComplete)
  if (data.closed !== undefined) params.closed = String(data.closed)
  if (data.idMembers !== undefined) params.idMembers = data.idMembers.join(',')
  if (data.idLabels !== undefined) params.idLabels = data.idLabels.join(',')

  return client.put<TrelloCard>(`/cards/${cardId}`, undefined, params)
}

/**
 * Move a card to a different list
 */
export async function moveCard(
  cardId: string,
  listId: string,
  pos?: 'top' | 'bottom' | number
): Promise<TrelloCard> {
  const params: UpdateCardDto = { idList: listId }
  if (pos !== undefined) params.pos = pos
  return updateCard(cardId, params)
}

/**
 * Delete (archive) a card
 */
export async function archiveCard(cardId: string): Promise<TrelloCard> {
  return updateCard(cardId, { closed: true })
}

/**
 * Permanently delete a card
 */
export async function deleteCard(cardId: string): Promise<void> {
  const client = getTrelloClient()
  await client.delete(`/cards/${cardId}`)
}

/**
 * Get card comments/actions
 */
export async function getCardActions(
  cardId: string,
  filter: string = 'commentCard'
): Promise<TrelloAction[]> {
  const client = getTrelloClient()
  return client.get<TrelloAction[]>(`/cards/${cardId}/actions`, {
    filter,
  })
}

/**
 * Add a comment to a card
 */
export async function addCardComment(
  cardId: string,
  text: string
): Promise<TrelloAction> {
  const client = getTrelloClient()
  return client.post<TrelloAction>(`/cards/${cardId}/actions/comments`, undefined, {
    text,
  })
}

/**
 * Get card checklists
 */
export async function getCardChecklists(cardId: string): Promise<TrelloChecklist[]> {
  const client = getTrelloClient()
  return client.get<TrelloChecklist[]>(`/cards/${cardId}/checklists`)
}

/**
 * Create a checklist on a card
 */
export async function createChecklist(
  cardId: string,
  name: string
): Promise<TrelloChecklist> {
  const client = getTrelloClient()
  return client.post<TrelloChecklist>('/checklists', undefined, {
    idCard: cardId,
    name,
  })
}

/**
 * Add an item to a checklist
 */
export async function addChecklistItem(
  checklistId: string,
  name: string,
  checked: boolean = false
): Promise<{ id: string; name: string; state: string }> {
  const client = getTrelloClient()
  return client.post(`/checklists/${checklistId}/checkItems`, undefined, {
    name,
    checked: String(checked),
  })
}

/**
 * Get card attachments
 */
export async function getCardAttachments(cardId: string): Promise<TrelloAttachment[]> {
  const client = getTrelloClient()
  return client.get<TrelloAttachment[]>(`/cards/${cardId}/attachments`)
}

/**
 * Add an attachment to a card (URL)
 */
export async function addCardAttachment(
  cardId: string,
  url: string,
  name?: string
): Promise<TrelloAttachment> {
  const client = getTrelloClient()
  const params: Record<string, string> = { url }
  if (name) params.name = name
  return client.post<TrelloAttachment>(`/cards/${cardId}/attachments`, undefined, params)
}

/**
 * Add/remove a member from a card
 */
export async function addCardMember(
  cardId: string,
  memberId: string
): Promise<TrelloCard> {
  const client = getTrelloClient()
  return client.post<TrelloCard>(`/cards/${cardId}/idMembers`, undefined, {
    value: memberId,
  })
}

export async function removeCardMember(
  cardId: string,
  memberId: string
): Promise<TrelloCard> {
  const client = getTrelloClient()
  return client.delete<TrelloCard>(`/cards/${cardId}/idMembers/${memberId}`)
}

/**
 * Add/remove a label from a card
 */
export async function addCardLabel(
  cardId: string,
  labelId: string
): Promise<void> {
  const client = getTrelloClient()
  await client.post(`/cards/${cardId}/idLabels`, undefined, {
    value: labelId,
  })
}

export async function removeCardLabel(
  cardId: string,
  labelId: string
): Promise<void> {
  const client = getTrelloClient()
  await client.delete(`/cards/${cardId}/idLabels/${labelId}`)
}
