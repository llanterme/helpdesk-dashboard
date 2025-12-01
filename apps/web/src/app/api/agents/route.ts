import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient, AgentRole, AgentStatus } from '@helpdesk/database'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const status = searchParams.get('status') || ''

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    // Search across name and email
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Filter by role
    if (role && role !== 'all') {
      where.role = role.toUpperCase() as AgentRole
    }

    // Filter by status
    if (status && status !== 'all') {
      where.status = status.toUpperCase() as AgentStatus
    }

    const [agents, total] = await Promise.all([
      prisma.agent.findMany({
        where,
        include: {
          _count: {
            select: {
              tickets: true,
              quotes: true,
              invoices: true
            }
          }
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit
      }),
      prisma.agent.count({ where })
    ])

    // Get ticket statistics for each agent
    const agentsWithStats = await Promise.all(
      agents.map(async (agent) => {
        const [ticketStats, activeTickets] = await Promise.all([
          prisma.ticket.groupBy({
            by: ['status'],
            where: { agentId: agent.id },
            _count: true
          }),
          prisma.ticket.count({
            where: {
              agentId: agent.id,
              status: { in: ['OPEN', 'PENDING'] }
            }
          })
        ])

        const ticketCounts = ticketStats.reduce((acc, stat) => {
          acc[stat.status.toLowerCase()] = stat._count
          return acc
        }, {} as Record<string, number>)

        return {
          ...agent,
          activeTickets,
          totalTickets: agent._count.tickets,
          totalQuotes: agent._count.quotes,
          totalInvoices: agent._count.invoices,
          ticketStats: ticketCounts
        }
      })
    )

    // Calculate summary statistics
    const summary = {
      total,
      byRole: await getAgentCountsByRole(),
      byStatus: await getAgentCountsByStatus(),
      activeAgents: await prisma.agent.count({ where: { status: 'ACTIVE' } }),
      totalActiveTickets: await prisma.ticket.count({
        where: {
          status: { in: ['OPEN', 'PENDING'] },
          agentId: { not: null }
        }
      })
    }

    return NextResponse.json({
      agents: agentsWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      summary
    })
  } catch (error) {
    console.error('Error fetching agents:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, phone, role, commissionRate, avatar, color } = body

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingAgent = await prisma.agent.findUnique({
      where: { email }
    })

    if (existingAgent) {
      return NextResponse.json(
        { error: 'Agent with this email already exists' },
        { status: 409 }
      )
    }

    // Validate role
    const validRoles = ['ADMIN', 'SENIOR_AGENT', 'AGENT']
    if (role && !validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role specified' },
        { status: 400 }
      )
    }

    // Validate commission rate
    if (commissionRate !== undefined && (commissionRate < 0 || commissionRate > 100)) {
      return NextResponse.json(
        { error: 'Commission rate must be between 0 and 100' },
        { status: 400 }
      )
    }

    const agent = await prisma.agent.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        role: (role as AgentRole) || 'AGENT',
        commissionRate: commissionRate || 50.0,
        avatar: avatar?.trim() || null,
        color: color?.trim() || null,
        status: 'ACTIVE'
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

    // Add computed fields for consistency
    const agentWithStats = {
      ...agent,
      activeTickets: 0,
      totalTickets: agent._count.tickets,
      totalQuotes: agent._count.quotes,
      totalInvoices: agent._count.invoices,
      ticketStats: {}
    }

    return NextResponse.json(agentWithStats, { status: 201 })
  } catch (error) {
    console.error('Error creating agent:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper functions
async function getAgentCountsByRole() {
  const counts = await prisma.agent.groupBy({
    by: ['role'],
    _count: true
  })

  return counts.reduce((acc, count) => {
    acc[count.role.toLowerCase()] = count._count
    return acc
  }, {} as Record<string, number>)
}

async function getAgentCountsByStatus() {
  const counts = await prisma.agent.groupBy({
    by: ['status'],
    _count: true
  })

  return counts.reduce((acc, count) => {
    acc[count.status.toLowerCase()] = count._count
    return acc
  }, {} as Record<string, number>)
}