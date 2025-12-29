/**
 * Trello API Type Definitions
 */

// Board types
export interface TrelloBoard {
  id: string
  name: string
  desc: string
  closed: boolean
  idOrganization: string | null
  url: string
  shortUrl: string
  prefs: TrelloBoardPrefs
  labelNames: Record<string, string>
}

export interface TrelloBoardPrefs {
  permissionLevel: 'private' | 'org' | 'public'
  background: string
  backgroundColor: string | null
  backgroundImage: string | null
}

// List types
export interface TrelloList {
  id: string
  name: string
  closed: boolean
  idBoard: string
  pos: number
}

// Card types
export interface TrelloCard {
  id: string
  name: string
  desc: string
  closed: boolean
  idBoard: string
  idList: string
  pos: number
  due: string | null
  dueComplete: boolean
  idMembers: string[]
  idLabels: string[]
  labels: TrelloLabel[]
  url: string
  shortUrl: string
  dateLastActivity: string
  idChecklists: string[]
  attachments?: TrelloAttachment[]
  badges: TrelloCardBadges
}

export interface TrelloCardBadges {
  attachments: number
  checkItems: number
  checkItemsChecked: number
  comments: number
  description: boolean
  due: string | null
  dueComplete: boolean
}

// Label types
export interface TrelloLabel {
  id: string
  idBoard: string
  name: string
  color: TrelloLabelColor | null
}

export type TrelloLabelColor =
  | 'green'
  | 'yellow'
  | 'orange'
  | 'red'
  | 'purple'
  | 'blue'
  | 'sky'
  | 'lime'
  | 'pink'
  | 'black'

// Member types
export interface TrelloMember {
  id: string
  username: string
  fullName: string
  avatarUrl: string | null
  initials: string
}

// Attachment types
export interface TrelloAttachment {
  id: string
  name: string
  url: string
  date: string
  mimeType: string
  bytes: number
}

// Checklist types
export interface TrelloChecklist {
  id: string
  name: string
  idBoard: string
  idCard: string
  pos: number
  checkItems: TrelloCheckItem[]
}

export interface TrelloCheckItem {
  id: string
  name: string
  state: 'complete' | 'incomplete'
  pos: number
}

// Comment/Action types
export interface TrelloAction {
  id: string
  idMemberCreator: string
  type: string
  date: string
  data: {
    text?: string
    card?: { id: string; name: string }
    board?: { id: string; name: string }
    list?: { id: string; name: string }
    listBefore?: { id: string; name: string }
    listAfter?: { id: string; name: string }
  }
  memberCreator: TrelloMember
}

// Webhook types
export interface TrelloWebhook {
  id: string
  description: string
  idModel: string
  callbackURL: string
  active: boolean
}

export interface TrelloWebhookPayload {
  model: TrelloBoard | TrelloCard | TrelloList
  action: TrelloAction
}

// Create/Update DTOs
export interface CreateCardDto {
  name: string
  desc?: string
  idList: string
  pos?: 'top' | 'bottom' | number
  due?: string
  idMembers?: string[]
  idLabels?: string[]
}

export interface UpdateCardDto {
  name?: string
  desc?: string
  idList?: string
  pos?: 'top' | 'bottom' | number
  due?: string | null
  dueComplete?: boolean
  closed?: boolean
  idMembers?: string[]
  idLabels?: string[]
}

export interface CreateListDto {
  name: string
  idBoard: string
  pos?: 'top' | 'bottom' | number
}

export interface CreateBoardDto {
  name: string
  desc?: string
  defaultLists?: boolean
  prefs_permissionLevel?: 'private' | 'org' | 'public'
}
