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

    const client = await prisma.client.findUnique({
      where: { id: params.id },
      include: {
        tickets: {
          include: {
            agent: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10 // Latest 10 tickets for overview
        },
        quotes: {
          include: {
            agent: true
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        invoices: {
          include: {
            agent: true
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        _count: {
          select: {
            tickets: true,
            quotes: true,
            invoices: true
          }
        }
      }
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Add computed stats
    const clientWithStats = {
      ...client,
      activeTickets: client.tickets.filter(t => t.status === 'OPEN').length,
      totalTickets: client._count.tickets,
      totalQuotes: client._count.quotes,
      totalInvoices: client._count.invoices,
      recentActivity: [
        ...client.tickets.slice(0, 3).map(ticket => ({
          type: 'ticket',
          id: ticket.id,
          title: ticket.subject,
          status: ticket.status,
          date: ticket.createdAt,
          agent: ticket.agent?.name
        })),
        ...client.quotes.slice(0, 2).map(quote => ({
          type: 'quote',
          id: quote.id,
          title: `Quote #${quote.id.slice(0, 8)}`,
          status: quote.status,
          date: quote.createdAt,
          agent: quote.agent?.name
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }

    return NextResponse.json(clientWithStats)
  } catch (error) {
    console.error('Error fetching client:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { name, email, phone, company } = data

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { id: params.id }
    })

    if (!existingClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Check for email conflicts (if email is being changed)
    if (email !== existingClient.email) {
      const emailConflict = await prisma.client.findUnique({
        where: { email }
      })

      if (emailConflict) {
        return NextResponse.json(
          { error: 'Another client already uses this email' },
          { status: 409 }
        )
      }
    }

    const client = await prisma.client.update({
      where: { id: params.id },
      data: {
        name,
        email,
        phone: phone || null,
        company: company || null
      },
      include: {
        _count: {
          select: {
            tickets: true,
            quotes: true,
            invoices: true
          }
        }
      }
    })

    return NextResponse.json(client)
  } catch (error) {
    console.error('Error updating client:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if client exists and has related data
    const client = await prisma.client.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            tickets: true,
            quotes: true,
            invoices: true
          }
        }
      }
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Prevent deletion if client has related data
    if (client._count.tickets > 0 || client._count.quotes > 0 || client._count.invoices > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete client with existing tickets, quotes, or invoices',
          details: {
            tickets: client._count.tickets,
            quotes: client._count.quotes,
            invoices: client._count.invoices
          }
        },
        { status: 409 }
      )
    }

    await prisma.client.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Client deleted successfully' })
  } catch (error) {
    console.error('Error deleting client:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}