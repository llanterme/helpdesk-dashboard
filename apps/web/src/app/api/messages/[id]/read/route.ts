import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@helpdesk/database'

const prisma = new PrismaClient()

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const messageId = params.id
    const { read = true } = await request.json()

    // Verify message exists
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        ticket: {
          select: { id: true }
        }
      }
    })

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Update message read status
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: { read }
    })

    // If marking as read, check if all messages in ticket are now read
    if (read) {
      const unreadCount = await prisma.message.count({
        where: {
          ticketId: message.ticketId,
          read: false,
          senderType: 'CLIENT' // Only count unread client messages
        }
      })

      // If no unread client messages, mark ticket as read
      if (unreadCount === 0) {
        await prisma.ticket.update({
          where: { id: message.ticketId },
          data: { unread: false }
        })
      }
    }

    return NextResponse.json({
      id: updatedMessage.id,
      read: updatedMessage.read,
      ticketId: message.ticketId
    })
  } catch (error) {
    console.error('Error updating message read status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Bulk mark messages as read in a ticket
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

    // Mark all unread messages in ticket as read
    const updateResult = await prisma.message.updateMany({
      where: {
        ticketId,
        read: false,
        senderType: 'CLIENT' // Only mark client messages as read
      },
      data: { read: true }
    })

    // Mark ticket as read
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { unread: false }
    })

    return NextResponse.json({
      ticketId,
      messagesMarkedRead: updateResult.count
    })
  } catch (error) {
    console.error('Error bulk marking messages as read:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}