/**
 * Zoho Desk Webhook Handler
 *
 * Receives events from Zoho Desk when:
 * - New WhatsApp ticket is created (via HelloSend)
 * - Ticket is updated (status, assignment)
 * - New thread/message is added
 *
 * Webhook Setup in Zoho Desk:
 * 1. Go to Setup > Developer Space > Webhooks
 * 2. Create webhook pointing to: https://your-domain.com/api/webhooks/zoho-desk
 * 3. Select events: ticket.add, ticket.update, thread.add
 * 4. Add X-Zoho-Webhook-Secret header with ZOHO_DESK_WEBHOOK_SECRET
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getZohoDeskConfig } from '@/lib/zoho/config'
import crypto from 'crypto'

// Zoho Desk webhook payload types
interface ZohoDeskTicketPayload {
  ticket?: {
    id: string
    ticketNumber: string
    subject: string
    description?: string
    status: string
    statusType: string
    priority?: string
    channel: string
    channelCode?: string
    contactId: string
    departmentId: string
    assigneeId?: string
    createdTime: string
    modifiedTime: string
    cf?: Record<string, unknown>
  }
  contact?: {
    id: string
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
    mobile?: string
  }
}

interface ZohoDeskThreadPayload {
  thread?: {
    id: string
    ticketId: string
    content: string
    contentType: string
    direction: 'in' | 'out'
    type: string
    channel?: string
    createdTime: string
    author?: {
      id: string
      name: string
      email?: string
      type: 'AGENT' | 'CONTACT' | 'SYSTEM'
    }
  }
}

interface ZohoDeskWebhookPayload {
  eventType: string
  eventTime: string
  orgId: string
  payload: ZohoDeskTicketPayload | ZohoDeskThreadPayload
}

// Map Zoho Desk status to local TicketStatus
function mapZohoDeskStatus(zohoStatus: string): 'OPEN' | 'PENDING' | 'RESOLVED' | 'CLOSED' {
  const statusMap: Record<string, 'OPEN' | 'PENDING' | 'RESOLVED' | 'CLOSED'> = {
    'Open': 'OPEN',
    'New': 'OPEN',
    'On Hold': 'PENDING',
    'Escalated': 'PENDING',
    'In Progress': 'PENDING',
    'Resolved': 'RESOLVED',
    'Closed': 'CLOSED',
  }
  return statusMap[zohoStatus] || 'OPEN'
}

// Map Zoho Desk priority to local TicketPriority
function mapZohoDeskPriority(zohoPriority?: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' {
  const priorityMap: Record<string, 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'> = {
    'Low': 'LOW',
    'Medium': 'MEDIUM',
    'High': 'HIGH',
    'Urgent': 'URGENT',
  }
  return priorityMap[zohoPriority || ''] || 'MEDIUM'
}

// Verify webhook signature
function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature || !secret) {
    console.warn('Missing webhook signature or secret')
    return false
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

// Handle new ticket creation
async function handleTicketAdd(payload: ZohoDeskTicketPayload): Promise<{ ticketId: string }> {
  const { ticket, contact } = payload

  if (!ticket) {
    throw new Error('Missing ticket data in payload')
  }

  // Only process WhatsApp tickets
  if (ticket.channel !== 'WhatsApp') {
    console.log(`Skipping non-WhatsApp ticket: ${ticket.channel}`)
    return { ticketId: '' }
  }

  // Check if ticket already exists
  const existingTicket = await prisma.ticket.findUnique({
    where: { zohoDeskTicketId: ticket.id },
  })

  if (existingTicket) {
    console.log(`Ticket already exists: ${existingTicket.id}`)
    return { ticketId: existingTicket.id }
  }

  // Find or create client based on contact
  let client = null
  if (contact) {
    const contactEmail = contact.email || `whatsapp_${contact.phone || contact.mobile || contact.id}@whatsapp.easyservicesgroup.co.za`
    const contactPhone = contact.phone || contact.mobile || ''

    // Try to find client by phone (WhatsApp ID) or email
    client = await prisma.client.findFirst({
      where: {
        OR: [
          { whatsappId: contactPhone.replace(/\D/g, '') },
          { email: contactEmail },
        ],
      },
    })

    if (!client) {
      // Create new client
      const contactName = [contact.firstName, contact.lastName]
        .filter(Boolean)
        .join(' ') || `WhatsApp User ${contactPhone}`

      client = await prisma.client.create({
        data: {
          name: contactName,
          email: contactEmail,
          phone: contactPhone || null,
          whatsappId: contactPhone.replace(/\D/g, '') || null,
        },
      })
    }
  } else {
    throw new Error('Missing contact data in payload')
  }

  // Create the ticket
  const newTicket = await prisma.ticket.create({
    data: {
      subject: ticket.subject || 'WhatsApp Conversation',
      channel: 'WHATSAPP',
      status: mapZohoDeskStatus(ticket.status),
      priority: mapZohoDeskPriority(ticket.priority),
      unread: true,
      clientId: client.id,
      zohoDeskTicketId: ticket.id,
      zohoDeskContactId: contact.id,
      zohoSyncedAt: new Date(),
      zohoSyncStatus: 'SYNCED',
    },
  })

  // Add initial message if description exists
  if (ticket.description) {
    await prisma.message.create({
      data: {
        ticketId: newTicket.id,
        senderType: 'CLIENT',
        senderId: client.id,
        content: ticket.description,
        read: false,
      },
    })
  }

  console.log(`Created ticket ${newTicket.id} from Zoho Desk ${ticket.id}`)
  return { ticketId: newTicket.id }
}

// Handle ticket update
async function handleTicketUpdate(payload: ZohoDeskTicketPayload): Promise<{ ticketId: string }> {
  const { ticket } = payload

  if (!ticket) {
    throw new Error('Missing ticket data in payload')
  }

  // Find local ticket
  const localTicket = await prisma.ticket.findUnique({
    where: { zohoDeskTicketId: ticket.id },
  })

  if (!localTicket) {
    // Ticket doesn't exist locally, create it
    return handleTicketAdd(payload)
  }

  // Update ticket status and priority
  await prisma.ticket.update({
    where: { id: localTicket.id },
    data: {
      status: mapZohoDeskStatus(ticket.status),
      priority: mapZohoDeskPriority(ticket.priority),
      zohoSyncedAt: new Date(),
      zohoSyncStatus: 'SYNCED',
    },
  })

  console.log(`Updated ticket ${localTicket.id} from Zoho Desk ${ticket.id}`)
  return { ticketId: localTicket.id }
}

// Handle new thread/message
async function handleThreadAdd(payload: ZohoDeskThreadPayload): Promise<{ messageId: string }> {
  const { thread } = payload

  if (!thread) {
    throw new Error('Missing thread data in payload')
  }

  // Find local ticket
  const localTicket = await prisma.ticket.findUnique({
    where: { zohoDeskTicketId: thread.ticketId },
    include: { client: true },
  })

  if (!localTicket) {
    console.log(`Ticket not found for thread: ${thread.ticketId}`)
    return { messageId: '' }
  }

  // Check for duplicate message
  const existingMessage = await prisma.message.findFirst({
    where: {
      ticketId: localTicket.id,
      content: thread.content,
      timestamp: {
        gte: new Date(new Date(thread.createdTime).getTime() - 5000), // Within 5 seconds
        lte: new Date(new Date(thread.createdTime).getTime() + 5000),
      },
    },
  })

  if (existingMessage) {
    console.log(`Message already exists: ${existingMessage.id}`)
    return { messageId: existingMessage.id }
  }

  // Determine sender type based on thread direction and author
  const isFromClient = thread.direction === 'in' || thread.author?.type === 'CONTACT'
  const senderType = isFromClient ? 'CLIENT' : 'AGENT'
  const senderId = isFromClient ? localTicket.clientId : (thread.author?.id || null)

  // Create message
  const newMessage = await prisma.message.create({
    data: {
      ticketId: localTicket.id,
      senderType,
      senderId,
      content: thread.content,
      read: senderType === 'AGENT', // Agent messages are read, client messages are unread
      timestamp: new Date(thread.createdTime),
    },
  })

  // If message is from client, mark ticket as unread
  if (isFromClient) {
    await prisma.ticket.update({
      where: { id: localTicket.id },
      data: {
        unread: true,
        updatedAt: new Date(),
      },
    })
  }

  console.log(`Created message ${newMessage.id} from Zoho Desk thread ${thread.id}`)
  return { messageId: newMessage.id }
}

export async function POST(request: NextRequest) {
  try {
    const { webhookSecret } = getZohoDeskConfig()
    const rawBody = await request.text()
    const signature = request.headers.get('X-Zoho-Webhook-Secret') ||
                     request.headers.get('x-zoho-webhook-secret')

    // Verify webhook signature if secret is configured
    if (webhookSecret && !verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      console.error('Invalid webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const body: ZohoDeskWebhookPayload = JSON.parse(rawBody)
    const { eventType, payload } = body

    console.log(`Received Zoho Desk webhook: ${eventType}`)

    let result: { ticketId?: string; messageId?: string } = {}

    switch (eventType) {
      case 'ticket.add':
      case 'Ticket_Add':
        result = await handleTicketAdd(payload as ZohoDeskTicketPayload)
        break

      case 'ticket.update':
      case 'Ticket_Update':
        result = await handleTicketUpdate(payload as ZohoDeskTicketPayload)
        break

      case 'thread.add':
      case 'Thread_Add':
        result = await handleThreadAdd(payload as ZohoDeskThreadPayload)
        break

      default:
        console.log(`Unhandled event type: ${eventType}`)
    }

    return NextResponse.json({
      success: true,
      eventType,
      ...result,
    })
  } catch (error) {
    console.error('Zoho Desk webhook error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// Optional: Verify webhook endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Zoho Desk webhook endpoint is active',
    timestamp: new Date().toISOString(),
  })
}
