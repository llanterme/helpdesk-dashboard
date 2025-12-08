import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const searchParams = request.nextUrl.searchParams
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required for verification' },
        { status: 400 }
      )
    }

    // Find ticket and verify it belongs to the client with this email
    const ticket = await prisma.ticket.findFirst({
      where: {
        id,
        client: {
          email: email.toLowerCase(),
        },
      },
      include: {
        client: {
          select: {
            name: true,
            email: true,
          },
        },
        messages: {
          orderBy: {
            timestamp: 'asc',
          },
          select: {
            id: true,
            content: true,
            senderType: true,
            timestamp: true,
          },
        },
      },
    })

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found or access denied' },
        { status: 404 }
      )
    }

    // Transform messages to include sender info
    const messagesWithSender = ticket.messages.map((msg) => ({
      ...msg,
      sender: {
        name: msg.senderType === 'CLIENT' ? ticket.client.name : 'Easy Services',
        email: msg.senderType === 'CLIENT' ? ticket.client.email : 'support@easyservicesgroup.co.za',
      },
    }))

    return NextResponse.json({
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      status: ticket.status,
      priority: ticket.priority,
      channel: ticket.channel,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      client: ticket.client,
      messages: messagesWithSender,
    })
  } catch (error) {
    console.error('Portal ticket fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ticket' },
      { status: 500 }
    )
  }
}
