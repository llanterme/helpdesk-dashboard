import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient, AgentStatus } from '@helpdesk/database'

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

    const body = await request.json()
    const { status } = body

    // Validate status
    const validStatuses = ['ACTIVE', 'INACTIVE']
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Valid status is required (ACTIVE or INACTIVE)' },
        { status: 400 }
      )
    }

    // Check if agent exists
    const existingAgent = await prisma.agent.findUnique({
      where: { id: params.id }
    })

    if (!existingAgent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // If setting to INACTIVE, check for active tickets
    if (status === 'INACTIVE') {
      const activeTickets = await prisma.ticket.count({
        where: {
          agentId: params.id,
          status: { in: ['OPEN', 'PENDING'] }
        }
      })

      if (activeTickets > 0) {
        return NextResponse.json(
          {
            error: `Agent has ${activeTickets} active tickets. Please reassign them before deactivating the agent.`,
            activeTickets
          },
          { status: 409 }
        )
      }
    }

    const updatedAgent = await prisma.agent.update({
      where: { id: params.id },
      data: { status: status as AgentStatus },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      message: `Agent status updated to ${status}`,
      agent: updatedAgent
    })
  } catch (error) {
    console.error('Error updating agent status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}