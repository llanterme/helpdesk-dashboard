'use client'

import { Message, messageUtils } from '@/stores/messageStore'
import {
  CheckIcon,
  ClockIcon,
  DocumentTextIcon,
  PhotoIcon
} from '@heroicons/react/24/outline'
import { CheckCircleIcon } from '@heroicons/react/24/solid'

interface MessageBubbleProps {
  message: Message
  isCurrentUser?: boolean
  showAvatar?: boolean
  onMarkAsRead?: (messageId: string) => void
}

export function MessageBubble({
  message,
  isCurrentUser = false,
  showAvatar = true,
  onMarkAsRead
}: MessageBubbleProps) {
  const channelColor = messageUtils.getChannelColor(message.channel)
  const channelIcon = messageUtils.getChannelIcon(message.channel)

  // Determine bubble styling based on sender and channel
  const getBubbleClasses = () => {
    if (isCurrentUser || message.senderType === 'AGENT') {
      // Agent/sent messages - right aligned with primary colors
      return `ml-auto bg-slate-600 text-white`
    } else {
      // Client messages - left aligned with channel-specific colors
      switch (message.channel) {
        case 'WHATSAPP':
          return 'mr-auto bg-green-100 text-green-900 border border-green-200'
        case 'EMAIL':
          return 'mr-auto bg-red-50 text-red-900 border border-red-200'
        case 'FORM':
          return 'mr-auto bg-blue-50 text-blue-900 border border-blue-200'
        case 'CHAT':
          return 'mr-auto bg-purple-50 text-purple-900 border border-purple-200'
        default:
          return 'mr-auto bg-gray-100 text-gray-900 border border-gray-200'
      }
    }
  }

  const getChannelBadge = () => {
    if (message.senderType === 'CLIENT') {
      return (
        <div
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
          style={{
            backgroundColor: `${channelColor}15`,
            color: channelColor,
            border: `1px solid ${channelColor}30`
          }}
        >
          <span>{channelIcon}</span>
          <span>{messageUtils.getChannelName(message.channel)}</span>
        </div>
      )
    }
    return null
  }

  const getReadStatus = () => {
    if (message.senderType === 'AGENT') {
      if (message.read) {
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />
      } else {
        return <CheckIcon className="h-4 w-4 text-gray-400" />
      }
    }
    return null
  }

  const handleBubbleClick = () => {
    if (!message.read && message.senderType === 'CLIENT' && onMarkAsRead) {
      onMarkAsRead(message.id)
    }
  }

  return (
    <div className={`flex items-start gap-3 mb-4 ${
      isCurrentUser || message.senderType === 'AGENT' ? 'flex-row-reverse' : 'flex-row'
    }`}>
      {/* Avatar */}
      {showAvatar && (
        <div className="flex-shrink-0">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
            style={{ backgroundColor: message.senderType === 'AGENT' ? '#64748b' : channelColor }}
          >
            {message.senderType === 'AGENT' ? '🎧' : channelIcon}
          </div>
        </div>
      )}

      {/* Message Content */}
      <div className={`flex flex-col max-w-xs lg:max-w-md ${
        isCurrentUser || message.senderType === 'AGENT' ? 'items-end' : 'items-start'
      }`}>
        {/* Sender Info & Channel Badge */}
        <div className={`flex items-center gap-2 mb-1 ${
          isCurrentUser || message.senderType === 'AGENT' ? 'flex-row-reverse' : 'flex-row'
        }`}>
          <span className="text-sm font-medium text-gray-700">
            {message.sender?.name || (message.senderType === 'AGENT' ? 'Agent' : 'Client')}
          </span>
          {getChannelBadge()}
        </div>

        {/* Message Bubble */}
        <div
          className={`${getBubbleClasses()} px-4 py-2 rounded-lg shadow-sm cursor-pointer transition-all hover:shadow-md`}
          onClick={handleBubbleClick}
        >
          {/* Message Content */}
          <div className="whitespace-pre-wrap break-words">
            {message.content}
          </div>

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.attachments.map(attachment => (
                <div key={attachment.id} className="flex items-center gap-2 p-2 rounded bg-black bg-opacity-10">
                  {attachment.type.startsWith('image/') ? (
                    <PhotoIcon className="h-4 w-4" />
                  ) : (
                    <DocumentTextIcon className="h-4 w-4" />
                  )}
                  <span className="text-sm truncate">{attachment.originalName}</span>
                  <span className="text-xs opacity-70">
                    {(attachment.size / 1024).toFixed(1)}KB
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Timestamp & Read Status */}
        <div className={`flex items-center gap-2 mt-1 ${
          isCurrentUser || message.senderType === 'AGENT' ? 'flex-row-reverse' : 'flex-row'
        }`}>
          <span className="text-xs text-gray-500">
            {messageUtils.formatTimestamp(message.timestamp)}
          </span>

          {getReadStatus()}

          {!message.read && message.senderType === 'CLIENT' && (
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          )}
        </div>
      </div>
    </div>
  )
}