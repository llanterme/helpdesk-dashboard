/**
 * Trello Boards Service
 *
 * Operations for boards and lists
 */

import { getTrelloClient } from './client'
import type {
  TrelloBoard,
  TrelloList,
  TrelloMember,
  CreateBoardDto,
  CreateListDto,
} from './types'

/**
 * Get all boards for the authenticated user
 */
export async function getBoards(): Promise<TrelloBoard[]> {
  const client = getTrelloClient()
  return client.get<TrelloBoard[]>('/members/me/boards', {
    fields: 'id,name,desc,closed,idOrganization,url,shortUrl,prefs,labelNames',
  })
}

/**
 * Get a specific board by ID
 */
export async function getBoard(boardId: string): Promise<TrelloBoard> {
  const client = getTrelloClient()
  return client.get<TrelloBoard>(`/boards/${boardId}`, {
    fields: 'id,name,desc,closed,idOrganization,url,shortUrl,prefs,labelNames',
  })
}

/**
 * Create a new board
 */
export async function createBoard(data: CreateBoardDto): Promise<TrelloBoard> {
  const client = getTrelloClient()
  return client.post<TrelloBoard>('/boards', undefined, {
    name: data.name,
    desc: data.desc || '',
    defaultLists: String(data.defaultLists ?? true),
    prefs_permissionLevel: data.prefs_permissionLevel || 'private',
  })
}

/**
 * Get all lists on a board
 */
export async function getBoardLists(boardId: string): Promise<TrelloList[]> {
  const client = getTrelloClient()
  return client.get<TrelloList[]>(`/boards/${boardId}/lists`, {
    fields: 'id,name,closed,idBoard,pos',
  })
}

/**
 * Create a new list on a board
 */
export async function createList(data: CreateListDto): Promise<TrelloList> {
  const client = getTrelloClient()
  const params: Record<string, string> = {
    name: data.name,
    idBoard: data.idBoard,
  }
  if (data.pos !== undefined) {
    params.pos = String(data.pos)
  }
  return client.post<TrelloList>('/lists', undefined, params)
}

/**
 * Update a list
 */
export async function updateList(
  listId: string,
  data: { name?: string; closed?: boolean; pos?: number | 'top' | 'bottom' }
): Promise<TrelloList> {
  const client = getTrelloClient()
  const params: Record<string, string> = {}
  if (data.name !== undefined) params.name = data.name
  if (data.closed !== undefined) params.closed = String(data.closed)
  if (data.pos !== undefined) params.pos = String(data.pos)
  return client.put<TrelloList>(`/lists/${listId}`, undefined, params)
}

/**
 * Archive (close) a list
 */
export async function archiveList(listId: string): Promise<TrelloList> {
  return updateList(listId, { closed: true })
}

/**
 * Get board members
 */
export async function getBoardMembers(boardId: string): Promise<TrelloMember[]> {
  const client = getTrelloClient()
  return client.get<TrelloMember[]>(`/boards/${boardId}/members`, {
    fields: 'id,username,fullName,avatarUrl,initials',
  })
}

/**
 * Get board labels
 */
export async function getBoardLabels(boardId: string): Promise<{ id: string; name: string; color: string }[]> {
  const client = getTrelloClient()
  return client.get(`/boards/${boardId}/labels`)
}
