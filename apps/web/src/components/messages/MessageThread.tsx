'use client'

import { useEffect, useRef, useState } from 'react'
import { useMessageStore, messageUtils } from '@/stores/messageStore'
import { MessageBubble } from './MessageBubble'
import {
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

interface MessageThreadProps {
  ticketId: string
  className?: string
}

export function MessageThread({ ticketId, className = '' }: MessageThreadProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const {
    threads,
    loadMessages,
    markMessageAsRead,
    markAllMessagesAsRead,
    typingIndicators,
    setActiveTicket
  } = useMessageStore()

  const thread = threads[ticketId]
  const typing = typingIndicators[ticketId] || []

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [thread?.messages])

  // Load messages when component mounts
  useEffect(() => {
    loadMessages(ticketId)
    setActiveTicket(ticketId)

    return () => {
      setActiveTicket(undefined)
    }
  }, [ticketId, loadMessages])

  // Auto-mark messages as read when they come into view
  useEffect(() => {
    if (thread?.messages) {
      const unreadClientMessages = thread.messages.filter(
        m => !m.read && m.senderType === 'CLIENT'
      )
      if (unreadClientMessages.length > 0) {
        // Mark all as read after a short delay
        const timer = setTimeout(() => {
          markAllMessagesAsRead(ticketId)
        }, 1000)
        return () => clearTimeout(timer)
      }
    }
  }, [thread?.messages, ticketId, markAllMessagesAsRead])

  if (!thread) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center">
          <ArrowPathIcon className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-spin" />
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    )
  }

  if (thread.isLoading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center">
          <ArrowPathIcon className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-spin" />
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    )
  }

  if (thread.error) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center">
          <ExclamationTriangleIcon className="h-8 w-8 text-red-400 mx-auto mb-2" />
          <p className="text-red-600 mb-2">Failed to load messages</p>
          <p className="text-sm text-gray-600 mb-4">{thread.error}</p>
          <button
            onClick={() => loadMessages(ticketId)}
            className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (thread.messages.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center">
          <ChatBubbleLeftRightIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 mb-1">No messages yet</p>
          <p className="text-sm text-gray-500">Start a conversation with your client</p>
        </div>
      </div>
    )
  }

  // Group messages by date for better organization
  const groupMessagesByDate = () => {
    const groups: { date: string; messages: typeof thread.messages }[] = []
    let currentGroup: { date: string; messages: typeof thread.messages } | null = null

    thread.messages.forEach(message => {
      const messageDate = new Date(message.timestamp).toDateString()

      if (!currentGroup || currentGroup.date !== messageDate) {
        currentGroup = { date: messageDate, messages: [] }
        groups.push(currentGroup)
      }

      currentGroup.messages.push(message)
    })

    return groups
  }

  const messageGroups = groupMessagesByDate()

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {messageGroups.map(group => (
          <div key={group.date}>
            {/* Date Separator */}
            <div className="flex items-center justify-center my-4">
              <div className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                {new Date(group.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>

            {/* Messages for this date */}
            {group.messages.map((message, index) => {
              const prevMessage = index > 0 ? group.messages[index - 1] : null
              const showAvatar = !prevMessage ||
                prevMessage.senderType !== message.senderType ||
                new Date(message.timestamp).getTime() - new Date(prevMessage.timestamp).getTime() > 300000 // 5 minutes

              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  showAvatar={showAvatar}
                  onMarkAsRead={markMessageAsRead}
                />
              )
            })}
          </div>
        ))}

        {/* Typing Indicators */}
        {typing.length > 0 && (
          <div className="flex items-start gap-3 mb-4 opacity-70">
            <div className="flex-shrink-0">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                style={{ backgroundColor: messageUtils.getChannelColor(thread.channel) }}
              >
                {messageUtils.getChannelIcon(thread.channel)}
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-sm text-gray-500 mb-1">
                {typing.map(t => t.senderName).join(', ')} {typing.length === 1 ? 'is' : 'are'} typing...
              </span>

              <div className="bg-gray-100 px-4 py-2 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}