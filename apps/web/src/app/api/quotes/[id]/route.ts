import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// Helper function to calculate quote totals
function calculateQuoteTotals(subtotal: number, taxRate: number, discountRate: number) {
  const discountAmount = (subtotal * discountRate) / 100
  const subtotalAfterDiscount = subtotal - discountAmount
  const taxAmount = (subtotalAfterDiscount * taxRate) / 100
  const totalAmount = subtotalAfterDiscount + taxAmount

  return {
    discountAmount: Math.round(discountAmount * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100
  }
}

// GET /api/quotes/[id] - Get quote details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const quote = await prisma.quote.findUnique({
      where: { id: params.id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            company: true,
            createdAt: true
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
                description: true,
                category: true,
                sku: true,
                unit: true,
                rate: true
              }
            }
          },
          orderBy: { id: 'asc' }
        },
        statusLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20
        },
        invoice: {
          select: {
            id: true,
            status: true,
            totalAmount: true,
            dueDate: true,
            createdAt: true
          }
        }
      }
    })

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    return NextResponse.json(quote)
  } catch (error) {
    console.error('Error fetching quote:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quote' },
      { status: 500 }
    )
  }
}

// PUT /api/quotes/[id] - Update quote
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
    const {
      clientId,
      agentId,
      items = [],
      taxRate,
      discountRate,
      notes,
      terms,
      validUntil,
      status
    } = body

    // Check if quote exists
    const existingQuote = await prisma.quote.findUnique({
      where: { id: params.id },
      include: { items: true }
    })

    if (!existingQuote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    // Don't allow editing accepted/expired quotes
    if (['ACCEPTED', 'EXPIRED'].includes(existingQuote.status)) {
      return NextResponse.json(
        { error: 'Cannot edit accepted or expired quotes' },
        { status: 400 }
      )
    }

    // Verify client exists (if changing)
    if (clientId && clientId !== existingQuote.clientId) {
      const client = await prisma.client.findUnique({
        where: { id: clientId }
      })
      if (!client) {
        return NextResponse.json(
          { error: 'Client not found' },
          { status: 404 }
        )
      }
    }

    // Verify agent exists (if provided)
    if (agentId) {
      const agent = await prisma.agent.findUnique({
        where: { id: agentId }
      })
      if (!agent) {
        return NextResponse.json(
          { error: 'Agent not found' },
          { status: 404 }
        )
      }
    }

    // Calculate new subtotal from items
    let subtotal = 0
    if (items && items.length > 0) {
      for (const item of items) {
        const service = await prisma.service.findUnique({
          where: { id: item.serviceId }
        })
        if (service) {
          const rate = item.rate !== undefined ? item.rate : service.rate
          const lineTotal = item.quantity * rate
          subtotal += lineTotal
        }
      }
    }

    // Calculate totals
    const finalTaxRate = taxRate !== undefined ? taxRate : existingQuote.taxRate
    const finalDiscountRate = discountRate !== undefined ? discountRate : existingQuote.discountRate
    const { discountAmount, taxAmount, totalAmount } = calculateQuoteTotals(
      subtotal,
      finalTaxRate,
      finalDiscountRate
    )

    // Update quote with items in a transaction
    const updatedQuote = await prisma.$transaction(async (tx) => {
      // Update the quote
      const quote = await tx.quote.update({
        where: { id: params.id },
        data: {
          ...(clientId && { clientId }),
          ...(agentId !== undefined && { agentId }),
          ...(subtotal !== undefined && { subtotal: Math.round(subtotal * 100) / 100 }),
          ...(taxRate !== undefined && { taxRate, taxAmount }),
          ...(discountRate !== undefined && { discountRate, discountAmount }),
          ...(totalAmount !== undefined && { totalAmount }),
          ...(notes !== undefined && { notes }),
          ...(terms !== undefined && { terms }),
          ...(validUntil !== undefined && { validUntil: validUntil ? new Date(validUntil) : null }),
          ...(status && status !== existingQuote.status && {
            status,
            ...(status === 'SENT' && !existingQuote.sentAt && { sentAt: new Date() }),
            ...(status === 'ACCEPTED' && !existingQuote.acceptedAt && { acceptedAt: new Date() }),
            ...(status === 'EXPIRED' && !existingQuote.expiredAt && { expiredAt: new Date() })
          })
        }
      })

      // Update quote items if provided
      if (items !== undefined) {
        // Delete existing items
        await tx.quoteItem.deleteMany({
          where: { quoteId: params.id }
        })

        // Create new items
        if (items.length > 0) {
          await Promise.all(
            items.map(async (item: any) => {
              const service = await tx.service.findUnique({
                where: { id: item.serviceId }
              })
              if (!service) {
                throw new Error(`Service ${item.serviceId} not found`)
              }

              const rate = item.rate !== undefined ? item.rate : service.rate
              const lineTotal = item.quantity * rate

              return tx.quoteItem.create({
                data: {
                  quoteId: params.id,
                  serviceId: item.serviceId,
                  quantity: item.quantity,
                  rate,
                  lineTotal: Math.round(lineTotal * 100) / 100,
                  customDescription: item.customDescription
                }
              })
            })
          )
        }
      }

      // Create status log if status changed
      if (status && status !== existingQuote.status) {
        await tx.quoteStatusLog.create({
          data: {
            quoteId: params.id,
            status,
            changedBy: agentId || existingQuote.agentId,
            notes: `Status changed from ${existingQuote.status} to ${status}`
          }
        })
      }

      return quote
    })

    // Fetch the complete updated quote
    const completeQuote = await prisma.quote.findUnique({
      where: { id: params.id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
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
                description: true,
                category: true,
                sku: true,
                unit: true
              }
            }
          }
        },
        statusLogs: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    return NextResponse.json(completeQuote)
  } catch (error) {
    console.error('Error updating quote:', error)
    return NextResponse.json(
      { error: 'Failed to update quote' },
      { status: 500 }
    )
  }
}

// DELETE /api/quotes/[id] - Delete quote (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if quote exists and can be deleted
    const quote = await prisma.quote.findUnique({
      where: { id: params.id },
      include: {
        invoice: true,
        _count: { select: { items: true } }
      }
    })

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    // Don't allow deleting quotes that have been converted to invoices
    if (quote.invoice) {
      return NextResponse.json(
        { error: 'Cannot delete quote that has been converted to an invoice' },
        { status: 400 }
      )
    }

    // Don't allow deleting accepted quotes
    if (quote.status === 'ACCEPTED') {
      return NextResponse.json(
        { error: 'Cannot delete accepted quotes' },
        { status: 400 }
      )
    }

    // Delete quote and all related items (cascade)
    await prisma.quote.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Quote deleted successfully' })
  } catch (error) {
    console.error('Error deleting quote:', error)
    return NextResponse.json(
      { error: 'Failed to delete quote' },
      { status: 500 }
    )
  }
}