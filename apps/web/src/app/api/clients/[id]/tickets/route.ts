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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') || ''
    const channel = searchParams.get('channel') || ''

    const skip = (page - 1) * limit

    // Check if client exists
    const client = await prisma.client.findUnique({
      where: { id: params.id },
      select: { id: true, name: true }
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const where: any = { clientId: params.id }

    // Filter by status if specified
    if (status && status !== 'all') {
      where.status = status.toUpperCase()
    }

    // Filter by channel if specified
    if (channel && channel !== 'all') {
      where.channel = channel.toUpperCase()
    }

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: {
          agent: true,
          messages: {
            orderBy: { timestamp: 'desc' },
            take: 1 // Get latest message for preview
          },
          _count: {
            select: { messages: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.ticket.count({ where })
    ])

    // Add computed fields
    const ticketsWithStats = tickets.map(ticket => ({
      ...ticket,
      lastMessage: ticket.messages[0]?.content || null,
      lastMessageTime: ticket.messages[0]?.timestamp || ticket.createdAt,
      messageCount: ticket._count.messages
    }))

    return NextResponse.json({
      client: {
        id: client.id,
        name: client.name
      },
      tickets: ticketsWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: {
        total,
        byStatus: await getTicketStatsByStatus(params.id),
        byChannel: await getTicketStatsByChannel(params.id)
      }
    })
  } catch (error) {
    console.error('Error fetching client tickets:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to get ticket stats by status
async function getTicketStatsByStatus(clientId: string) {
  const stats = await prisma.ticket.groupBy({
    by: ['status'],
    where: { clientId },
    _count: true
  })

  return stats.reduce((acc, stat) => {
    acc[stat.status.toLowerCase()] = stat._count
    return acc
  }, {} as Record<string, number>)
}

// Helper function to get ticket stats by channel
async function getTicketStatsByChannel(clientId: string) {
  const stats = await prisma.ticket.groupBy({
    by: ['channel'],
    where: { clientId },
    _count: true
  })

  return stats.reduce((acc, stat) => {
    acc[stat.channel.toLowerCase()] = stat._count
    return acc
  }, {} as Record<string, number>)
}