import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@helpdesk/database'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ticketId = params.id

    // Verify ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, channel: true }
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Get messages with sender details
    const messages = await prisma.message.findMany({
      where: { ticketId },
      orderBy: { timestamp: 'asc' },
      include: {
        ticket: {
          select: {
            channel: true,
            client: { select: { name: true, email: true } },
            agent: { select: { name: true, email: true } }
          }
        }
      }
    })

    // Transform messages to include sender info
    const transformedMessages = messages.map(message => {
      const senderInfo = message.senderType === 'CLIENT'
        ? message.ticket.client
        : message.ticket.agent

      return {
        id: message.id,
        ticketId: message.ticketId,
        senderType: message.senderType,
        senderId: message.senderId,
        content: message.content,
        timestamp: message.timestamp,
        read: message.read,
        channel: message.ticket.channel,
        sender: senderInfo
      }
    })

    return NextResponse.json({
      ticketId,
      channel: ticket.channel,
      messages: transformedMessages
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ticketId = params.id
    const { content, senderType = 'AGENT', senderId } = await request.json()

    // Validate input
    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      )
    }

    // Verify ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        channel: true,
        client: { select: { name: true, email: true } },
        agent: { select: { name: true, email: true } }
      }
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Create new message
    const newMessage = await prisma.message.create({
      data: {
        ticketId,
        senderType,
        senderId: senderId || session.user?.id,
        content: content.trim(),
        read: senderType === 'AGENT' // Agents' own messages are considered read
      }
    })

    // Update ticket's updatedAt timestamp
    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        updatedAt: new Date(),
        unread: senderType === 'CLIENT' // Mark ticket unread if client sends message
      }
    })

    // Get sender info for response
    const senderInfo = senderType === 'CLIENT' ? ticket.client : ticket.agent

    const messageWithSender = {
      ...newMessage,
      channel: ticket.channel,
      sender: senderInfo
    }

    return NextResponse.json(messageWithSender)
  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}