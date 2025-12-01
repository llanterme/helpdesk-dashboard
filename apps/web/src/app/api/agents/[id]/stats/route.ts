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
    const period = searchParams.get('period') || '30' // days
    const periodDays = parseInt(period)

    // Check if agent exists
    const agent = await prisma.agent.findUnique({
      where: { id: params.id },
      select: { id: true, name: true, email: true, role: true }
    })

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const periodStart = new Date()
    periodStart.setDate(periodStart.getDate() - periodDays)

    // Get detailed performance statistics
    const [
      ticketStats,
      quoteStats,
      invoiceStats,
      dailyActivity,
      channelBreakdown,
      priorityBreakdown
    ] = await Promise.all([
      getTicketStatistics(params.id, periodStart),
      getQuoteStatistics(params.id, periodStart),
      getInvoiceStatistics(params.id, periodStart),
      getDailyActivity(params.id, periodStart, periodDays),
      getChannelBreakdown(params.id, periodStart),
      getPriorityBreakdown(params.id, periodStart)
    ])

    // Calculate commission earnings (mock calculation)
    const commissionEarnings = await calculateCommissionEarnings(params.id, periodStart)

    return NextResponse.json({
      agent,
      period: {
        days: periodDays,
        start: periodStart,
        end: new Date()
      },
      tickets: ticketStats,
      quotes: quoteStats,
      invoices: invoiceStats,
      commission: commissionEarnings,
      activity: {
        daily: dailyActivity,
        byChannel: channelBreakdown,
        byPriority: priorityBreakdown
      }
    })
  } catch (error) {
    console.error('Error fetching agent stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper functions
async function getTicketStatistics(agentId: string, periodStart: Date) {
  const [totalTickets, periodTickets, statusBreakdown, avgResolutionTime] = await Promise.all([
    prisma.ticket.count({
      where: { agentId }
    }),
    prisma.ticket.count({
      where: {
        agentId,
        createdAt: { gte: periodStart }
      }
    }),
    prisma.ticket.groupBy({
      by: ['status'],
      where: {
        agentId,
        createdAt: { gte: periodStart }
      },
      _count: true
    }),
    // Mock average resolution time calculation
    // In a real system, you'd track actual resolution timestamps
    2.5
  ])

  const statusCounts = statusBreakdown.reduce((acc, item) => {
    acc[item.status.toLowerCase()] = item._count
    return acc
  }, {} as Record<string, number>)

  const resolvedCount = statusCounts.resolved || 0
  const closedCount = statusCounts.closed || 0
  const totalResolved = resolvedCount + closedCount
  const resolutionRate = periodTickets > 0 ? (totalResolved / periodTickets) * 100 : 0

  return {
    total: totalTickets,
    period: periodTickets,
    resolved: totalResolved,
    resolutionRate: Math.round(resolutionRate * 100) / 100,
    avgResolutionTime,
    byStatus: statusCounts
  }
}

async function getQuoteStatistics(agentId: string, periodStart: Date) {
  const [totalQuotes, periodQuotes, acceptedQuotes] = await Promise.all([
    prisma.quote.count({
      where: { agentId }
    }),
    prisma.quote.count({
      where: {
        agentId,
        createdAt: { gte: periodStart }
      }
    }),
    prisma.quote.count({
      where: {
        agentId,
        createdAt: { gte: periodStart },
        status: 'ACCEPTED'
      }
    })
  ])

  const acceptanceRate = periodQuotes > 0 ? (acceptedQuotes / periodQuotes) * 100 : 0

  return {
    total: totalQuotes,
    period: periodQuotes,
    accepted: acceptedQuotes,
    acceptanceRate: Math.round(acceptanceRate * 100) / 100
  }
}

async function getInvoiceStatistics(agentId: string, periodStart: Date) {
  const [totalInvoices, periodInvoices, paidInvoices, totalRevenue] = await Promise.all([
    prisma.invoice.count({
      where: { agentId }
    }),
    prisma.invoice.count({
      where: {
        agentId,
        createdAt: { gte: periodStart }
      }
    }),
    prisma.invoice.count({
      where: {
        agentId,
        createdAt: { gte: periodStart },
        status: 'PAID'
      }
    }),
    prisma.invoice.aggregate({
      where: {
        agentId,
        createdAt: { gte: periodStart },
        status: 'PAID'
      },
      _sum: {
        totalAmount: true
      }
    })
  ])

  return {
    total: totalInvoices,
    period: periodInvoices,
    paid: paidInvoices,
    revenue: totalRevenue._sum.totalAmount || 0
  }
}

async function getDailyActivity(agentId: string, periodStart: Date, days: number) {
  const dailyTickets = await prisma.$queryRaw<Array<{ date: string; count: number }>>`
    SELECT
      DATE(createdAt) as date,
      COUNT(*) as count
    FROM tickets
    WHERE agentId = ${agentId}
      AND createdAt >= ${periodStart}
    GROUP BY DATE(createdAt)
    ORDER BY date ASC
  `

  // Fill in missing days with 0 count
  const activity = []
  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - (days - 1 - i))
    const dateStr = date.toISOString().split('T')[0]

    const dayData = dailyTickets.find(d => d.date === dateStr)
    activity.push({
      date: dateStr,
      tickets: dayData ? Number(dayData.count) : 0
    })
  }

  return activity
}

async function getChannelBreakdown(agentId: string, periodStart: Date) {
  const channelStats = await prisma.ticket.groupBy({
    by: ['channel'],
    where: {
      agentId,
      createdAt: { gte: periodStart }
    },
    _count: true
  })

  return channelStats.reduce((acc, item) => {
    acc[item.channel.toLowerCase()] = item._count
    return acc
  }, {} as Record<string, number>)
}

async function getPriorityBreakdown(agentId: string, periodStart: Date) {
  const priorityStats = await prisma.ticket.groupBy({
    by: ['priority'],
    where: {
      agentId,
      createdAt: { gte: periodStart }
    },
    _count: true
  })

  return priorityStats.reduce((acc, item) => {
    acc[item.priority.toLowerCase()] = item._count
    return acc
  }, {} as Record<string, number>)
}

async function calculateCommissionEarnings(agentId: string, periodStart: Date) {
  // Get agent's commission rate
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    select: { commissionRate: true }
  })

  if (!agent) return { total: 0, rate: 0 }

  // Calculate from paid invoices
  const invoiceTotal = await prisma.invoice.aggregate({
    where: {
      agentId,
      createdAt: { gte: periodStart },
      status: 'PAID'
    },
    _sum: {
      totalAmount: true
    }
  })

  const revenue = invoiceTotal._sum.totalAmount || 0
  const commission = (revenue * agent.commissionRate) / 100

  return {
    revenue,
    rate: agent.commissionRate,
    commission: Math.round(commission * 100) / 100
  }
}