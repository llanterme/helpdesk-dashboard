/**
 * WhatsApp Business API Utilities
 */

// Configuration
export const WHATSAPP_CONFIG = {
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
  verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'esg-whatsapp-verify-2024',
  apiVersion: 'v18.0',
  baseUrl: 'https://graph.facebook.com'
}

/**
 * Check if WhatsApp API is configured
 */
export function isWhatsAppConfigured(): boolean {
  return !!(WHATSAPP_CONFIG.accessToken && WHATSAPP_CONFIG.phoneNumberId)
}

/**
 * Format a phone number for WhatsApp (remove + and spaces)
 */
export function formatPhoneForWhatsApp(phone: string): string {
  return phone.replace(/[^0-9]/g, '')
}

/**
 * Format a WhatsApp ID for display (add + and format)
 */
export function formatWhatsAppIdForDisplay(whatsappId: string): string {
  if (!whatsappId) return ''

  // South African number: 27XXXXXXXXX -> +27 XX XXX XXXX
  if (whatsappId.startsWith('27') && whatsappId.length === 11) {
    return `+${whatsappId.slice(0, 2)} ${whatsappId.slice(2, 4)} ${whatsappId.slice(4, 7)} ${whatsappId.slice(7)}`
  }

  // Generic: add + prefix
  return `+${whatsappId}`
}

/**
 * Send a text message via WhatsApp Business API
 */
export async function sendTextMessage(
  recipientPhone: string,
  text: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!isWhatsAppConfigured()) {
    console.log('[WhatsApp Dev Mode] Would send:', { to: recipientPhone, text })
    return {
      success: true,
      messageId: `dev_${Date.now()}`
    }
  }

  try {
    const response = await fetch(
      `${WHATSAPP_CONFIG.baseUrl}/${WHATSAPP_CONFIG.apiVersion}/${WHATSAPP_CONFIG.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_CONFIG.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: recipientPhone,
          type: 'text',
          text: { body: text }
        })
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.error?.message }
    }

    return { success: true, messageId: data.messages?.[0]?.id }
  } catch (error) {
    console.error('WhatsApp API error:', error)
    return { success: false, error: 'API request failed' }
  }
}

/**
 * Send a template message via WhatsApp Business API
 */
export async function sendTemplateMessage(
  recipientPhone: string,
  templateName: string,
  params: string[] = [],
  language: string = 'en'
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!isWhatsAppConfigured()) {
    console.log('[WhatsApp Dev Mode] Would send template:', {
      to: recipientPhone,
      template: templateName,
      params
    })
    return {
      success: true,
      messageId: `dev_template_${Date.now()}`
    }
  }

  try {
    const components = params.length > 0 ? [{
      type: 'body',
      parameters: params.map(param => ({ type: 'text', text: param }))
    }] : []

    const response = await fetch(
      `${WHATSAPP_CONFIG.baseUrl}/${WHATSAPP_CONFIG.apiVersion}/${WHATSAPP_CONFIG.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_CONFIG.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: recipientPhone,
          type: 'template',
          template: {
            name: templateName,
            language: { code: language },
            components
          }
        })
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.error?.message }
    }

    return { success: true, messageId: data.messages?.[0]?.id }
  } catch (error) {
    console.error('WhatsApp API error:', error)
    return { success: false, error: 'API request failed' }
  }
}

/**
 * Download media from WhatsApp
 */
export async function downloadMedia(mediaId: string): Promise<{
  success: boolean
  url?: string
  mimeType?: string
  error?: string
}> {
  if (!isWhatsAppConfigured()) {
    return { success: false, error: 'WhatsApp API not configured' }
  }

  try {
    // First, get the media URL
    const urlResponse = await fetch(
      `${WHATSAPP_CONFIG.baseUrl}/${WHATSAPP_CONFIG.apiVersion}/${mediaId}`,
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_CONFIG.accessToken}`
        }
      }
    )

    if (!urlResponse.ok) {
      return { success: false, error: 'Failed to get media URL' }
    }

    const urlData = await urlResponse.json()

    return {
      success: true,
      url: urlData.url,
      mimeType: urlData.mime_type
    }
  } catch (error) {
    console.error('Error downloading WhatsApp media:', error)
    return { success: false, error: 'Failed to download media' }
  }
}

/**
 * Mark a message as read in WhatsApp
 */
export async function markAsRead(messageId: string): Promise<boolean> {
  if (!isWhatsAppConfigured()) {
    return true // Dev mode - always succeed
  }

  try {
    const response = await fetch(
      `${WHATSAPP_CONFIG.baseUrl}/${WHATSAPP_CONFIG.apiVersion}/${WHATSAPP_CONFIG.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_CONFIG.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId
        })
      }
    )

    return response.ok
  } catch (error) {
    console.error('Error marking message as read:', error)
    return false
  }
}

/**
 * Get WhatsApp message status display text
 */
export function getStatusDisplay(status: string | null): {
  text: string
  icon: string
  color: string
} {
  switch (status) {
    case 'SENT':
      return { text: 'Sent', icon: 'check', color: 'text-gray-400' }
    case 'DELIVERED':
      return { text: 'Delivered', icon: 'check-double', color: 'text-gray-400' }
    case 'READ':
      return { text: 'Read', icon: 'check-double', color: 'text-blue-500' }
    case 'FAILED':
      return { text: 'Failed', icon: 'x', color: 'text-red-500' }
    default:
      return { text: '', icon: '', color: '' }
  }
}
