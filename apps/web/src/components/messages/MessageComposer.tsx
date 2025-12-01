'use client'

import { useState, useRef, useEffect } from 'react'
import { useMessageStore } from '@/stores/messageStore'
import {
  PaperAirplaneIcon,
  PaperClipIcon,
  FaceSmileIcon,
  XMarkIcon,
  DocumentTextIcon,
  PhotoIcon
} from '@heroicons/react/24/outline'

interface MessageComposerProps {
  ticketId: string
  onSendMessage?: (message: string) => void
  placeholder?: string
  className?: string
}

interface Attachment {
  id: string
  file: File
  preview?: string
  uploading: boolean
  error?: string
}

// Simple emoji picker data
const EMOJI_CATEGORIES = {
  'Smileys': ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪'],
  'Gestures': ['👍', '👎', '👌', '🤞', '✌️', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👏', '🙌', '🤝', '🙏'],
  'Objects': ['📧', '📨', '📩', '📤', '📥', '📦', '📋', '📌', '📍', '📎', '🖇️', '📁', '📂', '🗂️', '📅', '📆', '🗓️', '📇', '🗃️', '🗄️', '🗑️']
}

export function MessageComposer({
  ticketId,
  onSendMessage,
  placeholder = 'Type your message...',
  className = ''
}: MessageComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isTyping, setIsTyping] = useState(false)

  const { sendMessage, saveDraft, getDraft, clearDraft, setTyping, clearTyping } = useMessageStore()

  // Load draft message on component mount
  useEffect(() => {
    const draft = getDraft(ticketId)
    if (draft) {
      setMessage(draft)
    }
  }, [ticketId, getDraft])

  // Save draft when message changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (message.trim()) {
        saveDraft(ticketId, message)
      } else {
        clearDraft(ticketId)
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [message, ticketId, saveDraft, clearDraft])

  // Handle typing indicator
  useEffect(() => {
    if (message.trim() && !isTyping) {
      setIsTyping(true)
      setTyping(ticketId, 'Agent')
    } else if (!message.trim() && isTyping) {
      setIsTyping(false)
      clearTyping(ticketId, 'Agent')
    }
  }, [message, isTyping, ticketId, setTyping, clearTyping])

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
    }
  }, [message])

  const handleSend = async () => {
    if (!message.trim() && attachments.length === 0) return

    setIsSubmitting(true)

    try {
      // Upload attachments first
      const uploadedAttachments = []
      for (const attachment of attachments) {
        if (!attachment.uploading && !attachment.error) {
          try {
            const formData = new FormData()
            formData.append('file', attachment.file)
            formData.append('ticketId', ticketId)

            const response = await fetch('/api/messages/attachments', {
              method: 'POST',
              body: formData
            })

            if (response.ok) {
              const uploadedFile = await response.json()
              uploadedAttachments.push(uploadedFile)
            }
          } catch (error) {
            console.error('Error uploading attachment:', error)
          }
        }
      }

      // Send message with attachments
      let finalMessage = message.trim()
      if (uploadedAttachments.length > 0) {
        const fileList = uploadedAttachments.map(f => `📎 ${f.originalName}`).join('\n')
        finalMessage = finalMessage ? `${finalMessage}\n\n${fileList}` : fileList
      }

      const sentMessage = await sendMessage(ticketId, finalMessage)

      if (sentMessage) {
        // Clear form
        setMessage('')
        setAttachments([])
        clearDraft(ticketId)
        clearTyping(ticketId, 'Agent')
        setIsTyping(false)

        // Call callback if provided
        if (onSendMessage) {
          onSendMessage(finalMessage)
        }

        // Focus back on textarea
        textareaRef.current?.focus()
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    files.forEach(file => {
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        alert(`File "${file.name}" is too large. Maximum size is 10MB.`)
        return
      }

      const attachment: Attachment = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        uploading: false,
        error: undefined
      }

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          attachment.preview = e.target?.result as string
          setAttachments(prev => prev.map(a => a.id === attachment.id ? attachment : a))
        }
        reader.readAsDataURL(file)
      }

      setAttachments(prev => [...prev, attachment])
    })

    // Clear input
    e.target.value = ''
  }

  const removeAttachment = (attachmentId: string) => {
    setAttachments(prev => prev.filter(a => a.id !== attachmentId))
  }

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newMessage = message.slice(0, start) + emoji + message.slice(end)
      setMessage(newMessage)

      // Restore cursor position
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length
        textarea.focus()
      }, 0)
    } else {
      setMessage(prev => prev + emoji)
    }
    setShowEmojiPicker(false)
  }

  return (
    <div className={`bg-white border-t border-gray-200 ${className}`}>
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="p-3 border-b border-gray-100">
          <div className="flex flex-wrap gap-2">
            {attachments.map(attachment => (
              <div key={attachment.id} className="relative bg-gray-50 border border-gray-200 rounded-lg p-2 flex items-center gap-2 max-w-xs">
                {/* File Icon/Preview */}
                {attachment.preview ? (
                  <img src={attachment.preview} alt="" className="w-8 h-8 object-cover rounded" />
                ) : attachment.file.type.startsWith('image/') ? (
                  <PhotoIcon className="w-8 h-8 text-gray-400" />
                ) : (
                  <DocumentTextIcon className="w-8 h-8 text-gray-400" />
                )}

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{attachment.file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(attachment.file.size / 1024).toFixed(1)}KB
                  </p>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeAttachment(attachment.id)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>

                {/* Upload Status */}
                {attachment.uploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}

                {attachment.error && (
                  <div className="absolute inset-0 bg-red-500 bg-opacity-90 flex items-center justify-center rounded-lg">
                    <span className="text-white text-xs">Error</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 max-w-sm">
          <div className="space-y-3">
            {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
              <div key={category}>
                <h4 className="text-xs font-medium text-gray-700 mb-2">{category}</h4>
                <div className="grid grid-cols-8 gap-1">
                  {emojis.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => insertEmoji(emoji)}
                      className="p-1 text-lg hover:bg-gray-100 rounded transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Composer */}
      <div className="p-4">
        <div className="flex items-end gap-3">
          {/* Textarea */}
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows={1}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* File Upload */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isSubmitting}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Attach file"
            >
              <PaperClipIcon className="w-5 h-5" />
            </button>

            {/* Emoji Picker */}
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              disabled={isSubmitting}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Add emoji"
            >
              <FaceSmileIcon className="w-5 h-5" />
            </button>

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={(!message.trim() && attachments.length === 0) || isSubmitting}
              className="p-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Send message"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <PaperAirplaneIcon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Character Count & Hints */}
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <span>{message.length}/2000</span>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.txt"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}