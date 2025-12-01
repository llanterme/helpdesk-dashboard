import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// PUT /api/quotes/[id]/status - Update quote status
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
    const { status, notes, agentId } = body

    // Validate status
    const validStatuses = ['DRAFT', 'SENT', 'PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED']
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Valid status is required' },
        { status: 400 }
      )
    }

    // Check if quote exists
    const quote = await prisma.quote.findUnique({
      where: { id: params.id },
      include: {
        agent: {
          select: { id: true, name: true }
        }
      }
    })

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    // Validate status transitions
    const currentStatus = quote.status
    const validTransitions: { [key: string]: string[] } = {
      DRAFT: ['SENT', 'EXPIRED'],
      SENT: ['PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED'],
      PENDING: ['ACCEPTED', 'REJECTED', 'EXPIRED'],
      ACCEPTED: [], // Final state
      REJECTED: ['DRAFT'], // Can be reopened
      EXPIRED: ['DRAFT'] // Can be reopened
    }

    if (!validTransitions[currentStatus]?.includes(status) && currentStatus !== status) {
      return NextResponse.json(
        { error: `Cannot change status from ${currentStatus} to ${status}` },
        { status: 400 }
      )
    }

    // Update quote status in transaction
    const updatedQuote = await prisma.$transaction(async (tx) => {
      // Prepare update data
      const updateData: any = { status }

      // Set timestamps based on status
      if (status === 'SENT' && !quote.sentAt) {
        updateData.sentAt = new Date()
      }
      if (status === 'ACCEPTED' && !quote.acceptedAt) {
        updateData.acceptedAt = new Date()
      }
      if (status === 'EXPIRED' && !quote.expiredAt) {
        updateData.expiredAt = new Date()
      }

      // Update quote
      const quote = await tx.quote.update({
        where: { id: params.id },
        data: updateData
      })

      // Create status log entry
      await tx.quoteStatusLog.create({
        data: {
          quoteId: params.id,
          status,
          changedBy: agentId || null,
          notes: notes || `Status changed to ${status}`
        }
      })

      return quote
    })

    // Fetch complete quote with relations
    const completeQuote = await prisma.quote.findUnique({
      where: { id: params.id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true
          }
        },
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
            color: true
          }
        },
        items: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                category: true,
                sku: true,
                unit: true
              }
            }
          }
        },
        statusLogs: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    })

    return NextResponse.json(completeQuote)
  } catch (error) {
    console.error('Error updating quote status:', error)
    return NextResponse.json(
      { error: 'Failed to update quote status' },
      { status: 500 }
    )
  }
}