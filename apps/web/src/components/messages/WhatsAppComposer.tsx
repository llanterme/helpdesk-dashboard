'use client'

import { useState, useRef, useEffect } from 'react'
import {
  PaperAirplaneIcon,
  PaperClipIcon,
  FaceSmileIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  CheckIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline'

interface WhatsAppComposerProps {
  ticketId: string
  recipientPhone?: string
  onSendMessage?: (message: string) => void
  placeholder?: string
  className?: string
}

interface Template {
  name: string
  status: string
  category: string
  language: string
  components: Array<{
    type: string
    text?: string
  }>
}

// Simple emoji picker data
const EMOJI_CATEGORIES = {
  'Smileys': ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘'],
  'Gestures': ['👍', '👎', '👌', '🤞', '✌️', '🤟', '👏', '🙌', '🤝', '🙏'],
  'Objects': ['📧', '📨', '📩', '📋', '📎', '📁', '📅', '✅', '❌', '⚠️']
}

export function WhatsAppComposer({
  ticketId,
  recipientPhone,
  onSendMessage,
  placeholder = 'Type your message...',
  className = ''
}: WhatsAppComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [sendStatus, setSendStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle')
  const [statusMessage, setStatusMessage] = useState('')

  // Load templates
  useEffect(() => {
    async function fetchTemplates() {
      setLoadingTemplates(true)
      try {
        const response = await fetch('/api/whatsapp/templates')
        if (response.ok) {
          const data = await response.json()
          setTemplates(data.templates || [])
        }
      } catch (error) {
        console.error('Error loading templates:', error)
      } finally {
        setLoadingTemplates(false)
      }
    }
    fetchTemplates()
  }, [])

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
    }
  }, [message])

  const handleSend = async (templateName?: string, templateParams?: string[]) => {
    if (!message.trim() && !templateName) return

    setIsSubmitting(true)
    setSendStatus('sending')
    setStatusMessage('Sending via WhatsApp...')

    try {
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId,
          message: message.trim(),
          templateName,
          templateParams
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setSendStatus('sent')
        setStatusMessage('Message sent!')
        setMessage('')

        if (onSendMessage) {
          onSendMessage(message.trim())
        }

        // Clear status after 3 seconds
        setTimeout(() => {
          setSendStatus('idle')
          setStatusMessage('')
        }, 3000)
      } else {
        setSendStatus('failed')
        setStatusMessage(result.error || 'Failed to send message')

        // Clear error after 5 seconds
        setTimeout(() => {
          setSendStatus('idle')
          setStatusMessage('')
        }, 5000)
      }
    } catch (error) {
      console.error('Error sending WhatsApp message:', error)
      setSendStatus('failed')
      setStatusMessage('Network error. Please try again.')

      setTimeout(() => {
        setSendStatus('idle')
        setStatusMessage('')
      }, 5000)
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

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newMessage = message.slice(0, start) + emoji + message.slice(end)
      setMessage(newMessage)

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length
        textarea.focus()
      }, 0)
    } else {
      setMessage(prev => prev + emoji)
    }
    setShowEmojiPicker(false)
  }

  const selectTemplate = (template: Template) => {
    // Extract body text from template
    const bodyComponent = template.components.find(c => c.type === 'BODY')
    if (bodyComponent?.text) {
      setMessage(bodyComponent.text)
    }
    setShowTemplates(false)
  }

  const getStatusIcon = () => {
    switch (sendStatus) {
      case 'sending':
        return <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      case 'sent':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />
      case 'failed':
        return <ExclamationCircleIcon className="w-4 h-4 text-red-500" />
      default:
        return null
    }
  }

  return (
    <div className={`bg-white border-t border-gray-200 ${className}`}>
      {/* Status Bar */}
      {statusMessage && (
        <div className={`px-4 py-2 text-sm flex items-center gap-2 ${
          sendStatus === 'sent' ? 'bg-green-50 text-green-700' :
          sendStatus === 'failed' ? 'bg-red-50 text-red-700' :
          'bg-blue-50 text-blue-700'
        }`}>
          {getStatusIcon()}
          {statusMessage}
        </div>
      )}

      {/* Template Selector */}
      {showTemplates && (
        <div className="border-b border-gray-100 p-4 max-h-64 overflow-y-auto">
          <h4 className="text-sm font-medium text-gray-900 mb-3">WhatsApp Templates</h4>
          {loadingTemplates ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-5 h-5 border-2 border-gray-300 border-t-slate-600 rounded-full animate-spin" />
            </div>
          ) : templates.length === 0 ? (
            <p className="text-sm text-gray-500">No templates available</p>
          ) : (
            <div className="space-y-2">
              {templates.map(template => (
                <button
                  key={template.name}
                  onClick={() => selectTemplate(template)}
                  className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{template.name}</span>
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                      {template.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {template.components.find(c => c.type === 'BODY')?.text || 'No preview available'}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="border-b border-gray-100 p-4">
          <div className="space-y-3">
            {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
              <div key={category}>
                <h4 className="text-xs font-medium text-gray-700 mb-2">{category}</h4>
                <div className="flex flex-wrap gap-1">
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
          {/* WhatsApp Icon */}
          <div className="flex-shrink-0 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-white fill-current">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </div>

          {/* Textarea */}
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows={1}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Template Button */}
            <button
              onClick={() => {
                setShowTemplates(!showTemplates)
                setShowEmojiPicker(false)
              }}
              disabled={isSubmitting}
              className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                showTemplates
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title="Message templates"
            >
              <DocumentTextIcon className="w-5 h-5" />
            </button>

            {/* Emoji Picker */}
            <button
              onClick={() => {
                setShowEmojiPicker(!showEmojiPicker)
                setShowTemplates(false)
              }}
              disabled={isSubmitting}
              className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                showEmojiPicker
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title="Add emoji"
            >
              <FaceSmileIcon className="w-5 h-5" />
            </button>

            {/* Send Button */}
            <button
              onClick={() => handleSend()}
              disabled={!message.trim() || isSubmitting}
              className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Send WhatsApp message"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <PaperAirplaneIcon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Hints */}
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
          <span>
            <span className="inline-flex items-center gap-1">
              <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current text-green-500">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp Business
            </span>
            {' · '}Press Enter to send
          </span>
          <span>{message.length}/4096</span>
        </div>
      </div>
    </div>
  )
}
