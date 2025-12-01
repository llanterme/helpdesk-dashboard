import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@helpdesk/database'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const channel = searchParams.get('channel')
    const status = searchParams.get('status')
    const agentId = searchParams.get('agentId')

    const where: any = {}

    if (channel && channel !== 'all') {
      where.channel = channel.toUpperCase()
    }

    if (status && status !== 'all') {
      where.status = status.toUpperCase()
    }

    if (agentId) {
      where.agentId = agentId
    }

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        client: true,
        agent: true,
        messages: {
          orderBy: { timestamp: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(tickets)
  } catch (error) {
    console.error('Error fetching tickets:', error)
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

    const data = await request.json()
    const { subject, clientId, channel, priority = 'MEDIUM' } = data

    if (!subject || !clientId || !channel) {
      return NextResponse.json(
        { error: 'Missing required fields: subject, clientId, channel' },
        { status: 400 }
      )
    }

    const ticket = await prisma.ticket.create({
      data: {
        subject,
        clientId,
        channel: channel.toUpperCase(),
        priority: priority.toUpperCase(),
        status: 'OPEN'
      },
      include: {
        client: true,
        agent: true
      }
    })

    return NextResponse.json(ticket, { status: 201 })
  } catch (error) {
    console.error('Error creating ticket:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}