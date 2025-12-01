import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export type MessageChannel = 'WHATSAPP' | 'EMAIL' | 'FORM' | 'CHAT'
export type SenderType = 'CLIENT' | 'AGENT'

export interface MessageAttachment {
  id: string
  originalName: string
  filename: string
  size: number
  type: string
  url: string
  ticketId: string
  uploadedAt: string
  uploadedBy?: string
}

export interface MessageSender {
  name: string
  email: string
}

export interface Message {
  id: string
  ticketId: string
  senderType: SenderType
  senderId?: string
  content: string
  timestamp: Date | string
  read: boolean
  channel: MessageChannel
  sender: MessageSender
  attachments?: MessageAttachment[]
}

export interface MessageThread {
  ticketId: string
  channel: MessageChannel
  messages: Message[]
  lastUpdated: Date
  isLoading: boolean
  error?: string
}

export interface DraftMessage {
  ticketId: string
  content: string
  lastSaved: Date
}

export interface TypingIndicator {
  ticketId: string
  senderName: string
  timestamp: Date
}

interface MessageState {
  // Message threads by ticket ID
  threads: Record<string, MessageThread>

  // Draft messages by ticket ID
  drafts: Record<string, DraftMessage>

  // Active typing indicators by ticket ID
  typingIndicators: Record<string, TypingIndicator[]>

  // Currently active ticket for real-time updates
  activeTicketId?: string
}

interface MessageActions {
  // Thread management
  loadMessages: (ticketId: string) => Promise<void>
  sendMessage: (ticketId: string, content: string, senderType?: SenderType) => Promise<Message | null>
  markMessageAsRead: (messageId: string) => Promise<void>
  markAllMessagesAsRead: (ticketId: string) => Promise<void>

  // Real-time updates
  addMessage: (message: Message) => void
  updateMessage: (messageId: string, updates: Partial<Message>) => void
  setActiveTicket: (ticketId?: string) => void

  // Draft management
  saveDraft: (ticketId: string, content: string) => void
  getDraft: (ticketId: string) => string
  clearDraft: (ticketId: string) => void

  // Typing indicators
  setTyping: (ticketId: string, senderName: string) => void
  clearTyping: (ticketId: string, senderName?: string) => void

  // Utility
  clearThread: (ticketId: string) => void
  clearAllThreads: () => void
}

export interface MessageStore extends MessageState, MessageActions {}

// Utility functions
const messageUtils = {
  getChannelIcon: (channel: MessageChannel): string => {
    switch (channel) {
      case 'WHATSAPP': return '📱'
      case 'EMAIL': return '📧'
      case 'FORM': return '📝'
      case 'CHAT': return '💬'
      default: return '💬'
    }
  },

  getChannelColor: (channel: MessageChannel): string => {
    switch (channel) {
      case 'WHATSAPP': return '#25D366'
      case 'EMAIL': return '#EA4335'
      case 'FORM': return '#4285F4'
      case 'CHAT': return '#9333EA'
      default: return '#6B7280'
    }
  },

  getChannelName: (channel: MessageChannel): string => {
    switch (channel) {
      case 'WHATSAPP': return 'WhatsApp'
      case 'EMAIL': return 'Email'
      case 'FORM': return 'Contact Form'
      case 'CHAT': return 'Live Chat'
      default: return 'Unknown'
    }
  },

  formatTimestamp: (timestamp: Date | string): string => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString()
  },

  formatFullTimestamp: (timestamp: Date | string): string => {
    const date = new Date(timestamp)
    return date.toLocaleString()
  }
}

export { messageUtils }

export const useMessageStore = create<MessageStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      threads: {},
      drafts: {},
      typingIndicators: {},
      activeTicketId: undefined,

      // Load messages for a ticket
      loadMessages: async (ticketId: string) => {
        const state = get()
        const existingThread = state.threads[ticketId]

        // Skip loading if messages already exist and not too old
        if (existingThread && existingThread.messages.length > 0 && !existingThread.isLoading) {
          const timeSinceUpdate = Date.now() - existingThread.lastUpdated.getTime()
          if (timeSinceUpdate < 30000) { // 30 seconds cache
            return
          }
        }

        set(state => ({
          threads: {
            ...state.threads,
            [ticketId]: {
              ...state.threads[ticketId],
              ticketId,
              channel: state.threads[ticketId]?.channel || 'CHAT',
              messages: state.threads[ticketId]?.messages || [],
              isLoading: true,
              error: undefined,
              lastUpdated: new Date()
            }
          }
        }))

        try {
          const response = await fetch(`/api/tickets/${ticketId}/messages`)
          if (!response.ok) {
            throw new Error('Failed to load messages')
          }

          const data = await response.json()

          set(state => ({
            threads: {
              ...state.threads,
              [ticketId]: {
                ticketId,
                channel: data.channel,
                messages: data.messages.map((msg: any) => ({
                  ...msg,
                  timestamp: new Date(msg.timestamp)
                })),
                isLoading: false,
                lastUpdated: new Date()
              }
            }
          }))
        } catch (error) {
          console.error('Error loading messages:', error)
          set(state => ({
            threads: {
              ...state.threads,
              [ticketId]: {
                ...state.threads[ticketId],
                isLoading: false,
                error: error instanceof Error ? error.message : 'Failed to load messages'
              }
            }
          }))
        }
      },

      // Send a new message
      sendMessage: async (ticketId: string, content: string, senderType = 'AGENT' as SenderType) => {
        if (!content.trim()) return null

        try {
          const response = await fetch(`/api/tickets/${ticketId}/messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              content: content.trim(),
              senderType
            })
          })

          if (!response.ok) {
            throw new Error('Failed to send message')
          }

          const newMessage = await response.json()

          // Add message to store
          set(state => {
            const thread = state.threads[ticketId]
            if (!thread) return state

            return {
              threads: {
                ...state.threads,
                [ticketId]: {
                  ...thread,
                  messages: [...thread.messages, {
                    ...newMessage,
                    timestamp: new Date(newMessage.timestamp)
                  }],
                  lastUpdated: new Date()
                }
              }
            }
          })

          // Clear draft if it was from this ticket
          get().clearDraft(ticketId)

          return newMessage
        } catch (error) {
          console.error('Error sending message:', error)
          return null
        }
      },

      // Mark a single message as read
      markMessageAsRead: async (messageId: string) => {
        try {
          const response = await fetch(`/api/messages/${messageId}/read`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ read: true })
          })

          if (response.ok) {
            set(state => {
              const updatedThreads = { ...state.threads }

              Object.keys(updatedThreads).forEach(ticketId => {
                const messageIndex = updatedThreads[ticketId].messages.findIndex(m => m.id === messageId)
                if (messageIndex !== -1) {
                  updatedThreads[ticketId] = {
                    ...updatedThreads[ticketId],
                    messages: updatedThreads[ticketId].messages.map(msg =>
                      msg.id === messageId ? { ...msg, read: true } : msg
                    )
                  }
                }
              })

              return { threads: updatedThreads }
            })
          }
        } catch (error) {
          console.error('Error marking message as read:', error)
        }
      },

      // Mark all messages in a ticket as read
      markAllMessagesAsRead: async (ticketId: string) => {
        try {
          const response = await fetch(`/api/messages/${ticketId}/read`, {
            method: 'POST'
          })

          if (response.ok) {
            set(state => ({
              threads: {
                ...state.threads,
                [ticketId]: {
                  ...state.threads[ticketId],
                  messages: state.threads[ticketId]?.messages.map(msg => ({ ...msg, read: true })) || []
                }
              }
            }))
          }
        } catch (error) {
          console.error('Error marking all messages as read:', error)
        }
      },

      // Add a message (for real-time updates)
      addMessage: (message: Message) => {
        set(state => {
          const thread = state.threads[message.ticketId]
          if (!thread) return state

          // Check if message already exists
          const exists = thread.messages.some(m => m.id === message.id)
          if (exists) return state

          return {
            threads: {
              ...state.threads,
              [message.ticketId]: {
                ...thread,
                messages: [...thread.messages, message],
                lastUpdated: new Date()
              }
            }
          }
        })
      },

      // Update a message
      updateMessage: (messageId: string, updates: Partial<Message>) => {
        set(state => {
          const updatedThreads = { ...state.threads }

          Object.keys(updatedThreads).forEach(ticketId => {
            const messageIndex = updatedThreads[ticketId].messages.findIndex(m => m.id === messageId)
            if (messageIndex !== -1) {
              updatedThreads[ticketId] = {
                ...updatedThreads[ticketId],
                messages: updatedThreads[ticketId].messages.map(msg =>
                  msg.id === messageId ? { ...msg, ...updates } : msg
                )
              }
            }
          })

          return { threads: updatedThreads }
        })
      },

      // Set active ticket for real-time updates
      setActiveTicket: (ticketId?: string) => {
        set({ activeTicketId: ticketId })
      },

      // Save draft message
      saveDraft: (ticketId: string, content: string) => {
        set(state => ({
          drafts: {
            ...state.drafts,
            [ticketId]: {
              ticketId,
              content,
              lastSaved: new Date()
            }
          }
        }))
      },

      // Get draft message
      getDraft: (ticketId: string) => {
        const state = get()
        return state.drafts[ticketId]?.content || ''
      },

      // Clear draft message
      clearDraft: (ticketId: string) => {
        set(state => {
          const { [ticketId]: removed, ...remainingDrafts } = state.drafts
          return { drafts: remainingDrafts }
        })
      },

      // Set typing indicator
      setTyping: (ticketId: string, senderName: string) => {
        set(state => {
          const indicators = state.typingIndicators[ticketId] || []
          const existingIndex = indicators.findIndex(i => i.senderName === senderName)

          let updatedIndicators
          if (existingIndex !== -1) {
            updatedIndicators = indicators.map((indicator, index) =>
              index === existingIndex ? { ...indicator, timestamp: new Date() } : indicator
            )
          } else {
            updatedIndicators = [...indicators, {
              ticketId,
              senderName,
              timestamp: new Date()
            }]
          }

          return {
            typingIndicators: {
              ...state.typingIndicators,
              [ticketId]: updatedIndicators
            }
          }
        })
      },

      // Clear typing indicator
      clearTyping: (ticketId: string, senderName?: string) => {
        set(state => {
          const indicators = state.typingIndicators[ticketId] || []

          let updatedIndicators
          if (senderName) {
            updatedIndicators = indicators.filter(i => i.senderName !== senderName)
          } else {
            updatedIndicators = []
          }

          return {
            typingIndicators: {
              ...state.typingIndicators,
              [ticketId]: updatedIndicators
            }
          }
        })
      },

      // Clear thread
      clearThread: (ticketId: string) => {
        set(state => {
          const { [ticketId]: removed, ...remainingThreads } = state.threads
          return { threads: remainingThreads }
        })
      },

      // Clear all threads
      clearAllThreads: () => {
        set({ threads: {}, drafts: {}, typingIndicators: {} })
      }
    }),
    {
      name: 'message-store'
    }
  )
)