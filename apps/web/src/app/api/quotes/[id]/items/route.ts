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

// Helper function to recalculate quote totals after item changes
async function recalculateQuoteTotals(quoteId: string) {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { items: true }
  })

  if (!quote) return

  // Calculate new subtotal
  const subtotal = quote.items.reduce((sum, item) => sum + item.lineTotal, 0)

  // Calculate totals
  const { discountAmount, taxAmount, totalAmount } = calculateQuoteTotals(
    subtotal,
    quote.taxRate,
    quote.discountRate
  )

  // Update quote totals
  await prisma.quote.update({
    where: { id: quoteId },
    data: {
      subtotal: Math.round(subtotal * 100) / 100,
      discountAmount,
      taxAmount,
      totalAmount
    }
  })

  return { subtotal, discountAmount, taxAmount, totalAmount }
}

// POST /api/quotes/[id]/items - Add item to quote
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { serviceId, quantity = 1, rate, customDescription } = body

    // Validate required fields
    if (!serviceId || !quantity) {
      return NextResponse.json(
        { error: 'Service ID and quantity are required' },
        { status: 400 }
      )
    }

    // Check if quote exists and can be modified
    const quote = await prisma.quote.findUnique({
      where: { id: params.id }
    })

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    if (['ACCEPTED', 'EXPIRED'].includes(quote.status)) {
      return NextResponse.json(
        { error: 'Cannot modify accepted or expired quotes' },
        { status: 400 }
      )
    }

    // Verify service exists
    const service = await prisma.service.findUnique({
      where: { id: serviceId }
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    if (!service.active) {
      return NextResponse.json(
        { error: 'Service is not active' },
        { status: 400 }
      )
    }

    // Use provided rate or service's default rate
    const itemRate = rate !== undefined ? rate : service.rate
    const lineTotal = quantity * itemRate

    // Create quote item in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the quote item
      const quoteItem = await tx.quoteItem.create({
        data: {
          quoteId: params.id,
          serviceId,
          quantity,
          rate: itemRate,
          lineTotal: Math.round(lineTotal * 100) / 100,
          customDescription
        },
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
      })

      return quoteItem
    })

    // Recalculate quote totals
    await recalculateQuoteTotals(params.id)

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error adding quote item:', error)
    return NextResponse.json(
      { error: 'Failed to add quote item' },
      { status: 500 }
    )
  }
}

// GET /api/quotes/[id]/items - Get quote items
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if quote exists
    const quote = await prisma.quote.findUnique({
      where: { id: params.id }
    })

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    // Get quote items
    const items = await prisma.quoteItem.findMany({
      where: { quoteId: params.id },
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
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error('Error fetching quote items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quote items' },
      { status: 500 }
    )
  }
}