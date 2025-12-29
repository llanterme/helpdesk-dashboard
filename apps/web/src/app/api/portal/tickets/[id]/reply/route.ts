import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { message, email } = body

    if (!message || !email) {
      return NextResponse.json(
        { error: 'Message and email are required' },
        { status: 400 }
      )
    }

    // Verify the ticket belongs to this client
    const ticket = await prisma.ticket.findFirst({
      where: {
        id,
        client: {
          email: email.toLowerCase(),
        },
      },
      include: {
        client: true,
      },
    })

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found or access denied' },
        { status: 404 }
      )
    }

    // Check if ticket is closed
    if (ticket.status === 'CLOSED') {
      return NextResponse.json(
        { error: 'Cannot reply to a closed ticket' },
        { status: 400 }
      )
    }

    // Create the message
    const newMessage = await prisma.message.create({
      data: {
        ticketId: ticket.id,
        senderType: 'CLIENT',
        senderId: ticket.clientId,
        content: message.trim(),
        read: false,
      },
    })

    // Update ticket status to show customer responded (if it was pending)
    if (ticket.status === 'PENDING') {
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          status: 'OPEN',
          updatedAt: new Date(),
        },
      })
    } else {
      // Just update the timestamp
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { updatedAt: new Date() },
      })
    }

    return NextResponse.json({
      success: true,
      message: {
        id: newMessage.id,
        content: newMessage.content,
        senderType: newMessage.senderType,
        timestamp: newMessage.timestamp,
        sender: {
          name: ticket.client.name,
          email: ticket.client.email,
        },
      },
    })
  } catch (error) {
    console.error('Portal reply error:', error)
    return NextResponse.json(
      { error: 'Failed to send reply' },
      { status: 500 }
    )
  }
}
