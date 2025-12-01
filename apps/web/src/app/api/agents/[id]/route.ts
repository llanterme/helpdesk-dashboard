import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient, AgentRole, AgentStatus } from '@helpdesk/database'

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

    const agent = await prisma.agent.findUnique({
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

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // Get detailed statistics
    const [ticketStats, activeTickets, recentActivity] = await Promise.all([
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
      }),
      // Get recent ticket activity
      prisma.ticket.findMany({
        where: { agentId: agent.id },
        include: {
          client: {
            select: { name: true }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: 10
      })
    ])

    const ticketCounts = ticketStats.reduce((acc, stat) => {
      acc[stat.status.toLowerCase()] = stat._count
      return acc
    }, {} as Record<string, number>)

    // Calculate performance metrics
    const performanceMetrics = await calculatePerformanceMetrics(agent.id)

    const agentWithStats = {
      ...agent,
      activeTickets,
      totalTickets: agent._count.tickets,
      totalQuotes: agent._count.quotes,
      totalInvoices: agent._count.invoices,
      ticketStats: ticketCounts,
      recentActivity: recentActivity.map(ticket => ({
        id: ticket.id,
        subject: ticket.subject,
        clientName: ticket.client.name,
        status: ticket.status,
        updatedAt: ticket.updatedAt
      })),
      performanceMetrics
    }

    return NextResponse.json(agentWithStats)
  } catch (error) {
    console.error('Error fetching agent:', error)
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

    const body = await request.json()
    const { name, email, phone, role, commissionRate, avatar, color, status } = body

    // Check if agent exists
    const existingAgent = await prisma.agent.findUnique({
      where: { id: params.id }
    })

    if (!existingAgent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // Check if email is being changed and if it conflicts with another agent
    if (email && email !== existingAgent.email) {
      const emailConflict = await prisma.agent.findFirst({
        where: {
          email: email.trim().toLowerCase(),
          id: { not: params.id }
        }
      })

      if (emailConflict) {
        return NextResponse.json(
          { error: 'Another agent with this email already exists' },
          { status: 409 }
        )
      }
    }

    // Validate role if provided
    const validRoles = ['ADMIN', 'SENIOR_AGENT', 'AGENT']
    if (role && !validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role specified' },
        { status: 400 }
      )
    }

    // Validate status if provided
    const validStatuses = ['ACTIVE', 'INACTIVE']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status specified' },
        { status: 400 }
      )
    }

    // Validate commission rate if provided
    if (commissionRate !== undefined && (commissionRate < 0 || commissionRate > 100)) {
      return NextResponse.json(
        { error: 'Commission rate must be between 0 and 100' },
        { status: 400 }
      )
    }

    // Build update data
    const updateData: any = {}
    if (name !== undefined) updateData.name = name.trim()
    if (email !== undefined) updateData.email = email.trim().toLowerCase()
    if (phone !== undefined) updateData.phone = phone?.trim() || null
    if (role !== undefined) updateData.role = role as AgentRole
    if (commissionRate !== undefined) updateData.commissionRate = commissionRate
    if (avatar !== undefined) updateData.avatar = avatar?.trim() || null
    if (color !== undefined) updateData.color = color?.trim() || null
    if (status !== undefined) updateData.status = status as AgentStatus

    const updatedAgent = await prisma.agent.update({
      where: { id: params.id },
      data: updateData,
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

    // Get current statistics
    const [activeTickets, ticketStats] = await Promise.all([
      prisma.ticket.count({
        where: {
          agentId: updatedAgent.id,
          status: { in: ['OPEN', 'PENDING'] }
        }
      }),
      prisma.ticket.groupBy({
        by: ['status'],
        where: { agentId: updatedAgent.id },
        _count: true
      })
    ])

    const ticketCounts = ticketStats.reduce((acc, stat) => {
      acc[stat.status.toLowerCase()] = stat._count
      return acc
    }, {} as Record<string, number>)

    const agentWithStats = {
      ...updatedAgent,
      activeTickets,
      totalTickets: updatedAgent._count.tickets,
      totalQuotes: updatedAgent._count.quotes,
      totalInvoices: updatedAgent._count.invoices,
      ticketStats: ticketCounts
    }

    return NextResponse.json(agentWithStats)
  } catch (error) {
    console.error('Error updating agent:', error)
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

    // Check if agent exists
    const agent = await prisma.agent.findUnique({
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

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // Check if agent has related data
    const hasRelatedData = agent._count.tickets > 0 ||
                          agent._count.quotes > 0 ||
                          agent._count.invoices > 0

    if (hasRelatedData) {
      return NextResponse.json(
        {
          error: 'Cannot delete agent with existing tickets, quotes, or invoices. Set status to inactive instead.'
        },
        { status: 409 }
      )
    }

    await prisma.agent.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Agent deleted successfully' })
  } catch (error) {
    console.error('Error deleting agent:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to calculate performance metrics
async function calculatePerformanceMetrics(agentId: string) {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [totalTickets, resolvedTickets, avgResponseTime, recentTickets] = await Promise.all([
    prisma.ticket.count({
      where: { agentId }
    }),
    prisma.ticket.count({
      where: {
        agentId,
        status: { in: ['RESOLVED', 'CLOSED'] }
      }
    }),
    // This is a simplified calculation - in a real system you'd track actual response times
    prisma.ticket.aggregate({
      where: {
        agentId,
        updatedAt: { gte: thirtyDaysAgo }
      },
      _avg: {
        // Using created/updated time difference as a proxy
      }
    }),
    prisma.ticket.count({
      where: {
        agentId,
        createdAt: { gte: thirtyDaysAgo }
      }
    })
  ])

  const resolutionRate = totalTickets > 0 ? (resolvedTickets / totalTickets) * 100 : 0

  return {
    totalTickets,
    resolvedTickets,
    resolutionRate: Math.round(resolutionRate * 100) / 100,
    recentTickets,
    avgResponseTime: 2.5 // Mock value - would be calculated from message timestamps in real system
  }
}