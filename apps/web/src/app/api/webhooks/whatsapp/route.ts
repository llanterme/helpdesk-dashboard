import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@helpdesk/database'

const prisma = new PrismaClient()

// WhatsApp Business API Configuration
const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'esg-whatsapp-verify-2024'
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || ''
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || ''
const WHATSAPP_BUSINESS_ACCOUNT_ID = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || ''

/**
 * GET - Webhook Verification (Required by Meta)
 * Meta sends a GET request to verify the webhook URL during setup
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams

  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  // Verify the webhook
  if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
    console.log('WhatsApp webhook verified successfully')
    return new NextResponse(challenge, { status: 200 })
  }

  console.warn('WhatsApp webhook verification failed', { mode, token })
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 })
}

/**
 * POST - Receive WhatsApp Messages and Status Updates
 * This is called by Meta whenever there's a new message or status update
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Log the incoming webhook for debugging
    console.log('WhatsApp webhook received:', JSON.stringify(body, null, 2))

    // Validate it's from WhatsApp Business API
    if (body.object !== 'whatsapp_business_account') {
      return NextResponse.json({ error: 'Invalid webhook object' }, { status: 400 })
    }

    // Process each entry (can contain multiple messages)
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field === 'messages') {
          const value = change.value

          // Process incoming messages
          if (value.messages) {
            for (const message of value.messages) {
              await handleIncomingMessage(message, value.contacts?.[0])
            }
          }

          // Process status updates (sent, delivered, read)
          if (value.statuses) {
            for (const status of value.statuses) {
              await handleStatusUpdate(status)
            }
          }
        }
      }
    }

    // Always return 200 OK to acknowledge receipt
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error processing WhatsApp webhook:', error)
    // Still return 200 to prevent Meta from retrying
    return NextResponse.json({ success: true }, { status: 200 })
  }
}

/**
 * Handle an incoming WhatsApp message
 */
async function handleIncomingMessage(
  message: WhatsAppMessage,
  contact: WhatsAppContact | undefined
) {
  try {
    const fromPhone = message.from // Phone number without +
    const messageId = message.id
    const timestamp = new Date(parseInt(message.timestamp) * 1000)

    // Extract message content based on type
    let content = ''
    let mediaUrl = ''
    let mediaType = ''

    switch (message.type) {
      case 'text':
        content = message.text?.body || ''
        break
      case 'image':
        content = message.image?.caption || '[Image received]'
        mediaUrl = message.image?.id || '' // Media ID, needs to be fetched
        mediaType = 'image'
        break
      case 'document':
        content = message.document?.caption || `[Document: ${message.document?.filename}]`
        mediaUrl = message.document?.id || ''
        mediaType = 'document'
        break
      case 'audio':
        content = '[Voice message received]'
        mediaUrl = message.audio?.id || ''
        mediaType = 'audio'
        break
      case 'video':
        content = message.video?.caption || '[Video received]'
        mediaUrl = message.video?.id || ''
        mediaType = 'video'
        break
      case 'location':
        content = `[Location: ${message.location?.latitude}, ${message.location?.longitude}]`
        break
      case 'contacts':
        content = '[Contact shared]'
        break
      case 'button':
        content = message.button?.text || '[Button clicked]'
        break
      case 'interactive':
        content = message.interactive?.button_reply?.title ||
                  message.interactive?.list_reply?.title ||
                  '[Interactive response]'
        break
      default:
        content = `[${message.type} message]`
    }

    // Find or create client by WhatsApp ID
    let client = await prisma.client.findUnique({
      where: { whatsappId: fromPhone }
    })

    if (!client) {
      // Create new client from WhatsApp contact
      const contactName = contact?.profile?.name || `WhatsApp User ${fromPhone}`

      client = await prisma.client.create({
        data: {
          name: contactName,
          email: `whatsapp_${fromPhone}@placeholder.easyservicesgroup.co.za`,
          phone: `+${fromPhone}`,
          whatsappId: fromPhone
        }
      })
      console.log('Created new client from WhatsApp:', client.id)
    }

    // Find open/pending ticket for this client on WhatsApp channel, or create new one
    let ticket = await prisma.ticket.findFirst({
      where: {
        clientId: client.id,
        channel: 'WHATSAPP',
        status: { in: ['OPEN', 'PENDING'] }
      },
      orderBy: { updatedAt: 'desc' }
    })

    if (!ticket) {
      // Create new ticket
      ticket = await prisma.ticket.create({
        data: {
          subject: `WhatsApp conversation with ${client.name}`,
          channel: 'WHATSAPP',
          status: 'OPEN',
          priority: 'MEDIUM',
          clientId: client.id,
          unread: true
        }
      })
      console.log('Created new WhatsApp ticket:', ticket.id)
    } else {
      // Update ticket to mark as unread and bump timestamp
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          unread: true,
          updatedAt: new Date()
        }
      })
    }

    // Create the message
    await prisma.message.create({
      data: {
        ticketId: ticket.id,
        senderType: 'CLIENT',
        senderId: client.id,
        content,
        timestamp,
        read: false,
        whatsappMessageId: messageId,
        whatsappStatus: 'DELIVERED',
        mediaUrl: mediaUrl || null,
        mediaType: mediaType || null
      }
    })

    console.log('Stored WhatsApp message:', messageId)

    // Mark as read in WhatsApp (optional, shows blue ticks to sender)
    if (WHATSAPP_ACCESS_TOKEN && WHATSAPP_PHONE_NUMBER_ID) {
      await markMessageAsRead(messageId)
    }

  } catch (error) {
    console.error('Error handling incoming WhatsApp message:', error)
  }
}

/**
 * Handle WhatsApp message status updates
 */
async function handleStatusUpdate(status: WhatsAppStatus) {
  try {
    const { id: messageId, status: newStatus, timestamp } = status

    // Map WhatsApp status to our enum
    let dbStatus: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'
    switch (newStatus) {
      case 'sent':
        dbStatus = 'SENT'
        break
      case 'delivered':
        dbStatus = 'DELIVERED'
        break
      case 'read':
        dbStatus = 'READ'
        break
      case 'failed':
        dbStatus = 'FAILED'
        console.error('WhatsApp message failed:', status.errors)
        break
      default:
        return // Unknown status, ignore
    }

    // Update message status in database
    await prisma.message.updateMany({
      where: { whatsappMessageId: messageId },
      data: { whatsappStatus: dbStatus }
    })

    console.log(`Updated message ${messageId} status to ${dbStatus}`)
  } catch (error) {
    console.error('Error handling WhatsApp status update:', error)
  }
}

/**
 * Mark a message as read in WhatsApp (shows blue ticks)
 */
async function markMessageAsRead(messageId: string) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId
        })
      }
    )

    if (!response.ok) {
      console.error('Failed to mark message as read:', await response.text())
    }
  } catch (error) {
    console.error('Error marking message as read:', error)
  }
}

// TypeScript interfaces for WhatsApp webhook payload
interface WhatsAppMessage {
  from: string
  id: string
  timestamp: string
  type: string
  text?: { body: string }
  image?: { id: string; caption?: string }
  document?: { id: string; filename?: string; caption?: string }
  audio?: { id: string }
  video?: { id: string; caption?: string }
  location?: { latitude: number; longitude: number }
  button?: { text: string }
  interactive?: {
    button_reply?: { id: string; title: string }
    list_reply?: { id: string; title: string }
  }
}

interface WhatsAppContact {
  wa_id: string
  profile: { name: string }
}

interface WhatsAppStatus {
  id: string
  status: 'sent' | 'delivered' | 'read' | 'failed'
  timestamp: string
  recipient_id: string
  errors?: Array<{ code: number; title: string }>
}
