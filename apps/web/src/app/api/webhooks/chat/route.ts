import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@helpdesk/database'

const prisma = new PrismaClient()

// CORS headers for cross-origin requests from website
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Session-ID',
}

// Handle preflight OPTIONS request
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

/**
 * GET - Get chat session and messages
 * Used to restore chat history when visitor returns
 */
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.headers.get('X-Session-ID')

    if (!sessionId) {
      return NextResponse.json(
        { messages: [], ticketId: null },
        { headers: corsHeaders }
      )
    }

    // Find ticket by session ID (stored in subject)
    const ticket = await prisma.ticket.findFirst({
      where: {
        channel: 'CHAT',
        subject: { contains: sessionId }
      },
      include: {
        messages: {
          orderBy: { timestamp: 'asc' },
          take: 50
        },
        client: true
      }
    })

    if (!ticket) {
      return NextResponse.json(
        { messages: [], ticketId: null },
        { headers: corsHeaders }
      )
    }

    return NextResponse.json({
      ticketId: ticket.id,
      messages: ticket.messages.map(m => ({
        id: m.id,
        content: m.content,
        senderType: m.senderType,
        timestamp: m.timestamp
      })),
      client: {
        name: ticket.client.name,
        email: ticket.client.email
      }
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Error fetching chat session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}

/**
 * POST - Send chat message or start new chat
 * Creates ticket on first message, adds to existing ticket on subsequent
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, sessionId, visitorName, visitorEmail, visitorPhone, pageUrl } = body

    if (!message || !sessionId) {
      return NextResponse.json(
        { error: 'Message and sessionId are required' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Find existing chat ticket for this session
    let ticket = await prisma.ticket.findFirst({
      where: {
        channel: 'CHAT',
        subject: { contains: sessionId },
        status: { in: ['OPEN', 'PENDING'] }
      },
      include: { client: true }
    })

    let client = ticket?.client ?? null

    // If no existing ticket, create client and ticket
    if (!ticket) {
      // Create or find client
      const clientEmail = visitorEmail || `chat_${sessionId}@visitor.easyservicesgroup.co.za`

      client = await prisma.client.findUnique({
        where: { email: clientEmail }
      })

      if (!client) {
        client = await prisma.client.create({
          data: {
            name: visitorName || `Website Visitor`,
            email: clientEmail,
            phone: visitorPhone || null
          }
        })
      }

      // Create new chat ticket
      ticket = await prisma.ticket.create({
        data: {
          subject: `Live Chat [${sessionId}]`,
          channel: 'CHAT',
          status: 'OPEN',
          priority: 'MEDIUM',
          clientId: client.id,
          unread: true
        },
        include: { client: true }
      })

      // Add system message about chat origin
      await prisma.message.create({
        data: {
          ticketId: ticket.id,
          senderType: 'CLIENT',
          senderId: client.id,
          content: `[Chat started from: ${pageUrl || 'Website'}]`,
          read: false
        }
      })
    }

    // Add the visitor's message
    const newMessage = await prisma.message.create({
      data: {
        ticketId: ticket.id,
        senderType: 'CLIENT',
        senderId: client!.id,
        content: message,
        read: false
      }
    })

    // Update ticket to mark as unread
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        unread: true,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      ticketId: ticket.id,
      messageId: newMessage.id,
      timestamp: newMessage.timestamp
    }, { status: 201, headers: corsHeaders })

  } catch (error) {
    console.error('Error processing chat message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
