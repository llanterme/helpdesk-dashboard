import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// Helper function to generate quote number
function generateQuoteNumber(): string {
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0')
  return `QT-${timestamp}${random}`
}

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

// GET /api/quotes - List quotes with filtering and search
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status')
    const agentId = searchParams.get('agentId')
    const clientId = searchParams.get('clientId')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Build where clause for filtering
    const where: any = {}

    // Search across quote number and client name
    if (search) {
      where.OR = [
        { number: { contains: search, mode: 'insensitive' } },
        { client: { name: { contains: search, mode: 'insensitive' } } },
        { client: { email: { contains: search, mode: 'insensitive' } } },
        { client: { company: { contains: search, mode: 'insensitive' } } }
      ]
    }

    // Filter by status
    if (status && status !== 'all') {
      where.status = status
    }

    // Filter by agent
    if (agentId && agentId !== 'all') {
      where.agentId = agentId
    }

    // Filter by client
    if (clientId && clientId !== 'all') {
      where.clientId = clientId
    }

    // Get quotes with related data
    const quotes = await prisma.quote.findMany({
      where,
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
                sku: true
              }
            }
          }
        },
        _count: {
          select: {
            items: true
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      skip,
      take: limit
    })

    // Get total count for pagination
    const totalQuotes = await prisma.quote.count({ where })

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalQuotes / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    return NextResponse.json({
      quotes,
      pagination: {
        page,
        limit,
        total: totalQuotes,
        totalPages,
        hasNext,
        hasPrev
      }
    })
  } catch (error) {
    console.error('Error fetching quotes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quotes' },
      { status: 500 }
    )
  }
}

// POST /api/quotes - Create new quote
export async function POST(request: NextRequest) {
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
      taxRate = 15.0,
      discountRate = 0,
      notes,
      terms,
      validUntil
    } = body

    // Validate required fields
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
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

    // Generate unique quote number
    let quoteNumber: string
    let isUnique = false
    do {
      quoteNumber = generateQuoteNumber()
      const existing = await prisma.quote.findUnique({
        where: { number: quoteNumber }
      })
      isUnique = !existing
    } while (!isUnique)

    // Calculate subtotal from items
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
    const { discountAmount, taxAmount, totalAmount } = calculateQuoteTotals(
      subtotal,
      taxRate,
      discountRate
    )

    // Create quote with items in a transaction
    const quote = await prisma.$transaction(async (tx) => {
      // Create the quote
      const newQuote = await tx.quote.create({
        data: {
          number: quoteNumber,
          clientId,
          agentId,
          subtotal: Math.round(subtotal * 100) / 100,
          taxRate,
          taxAmount,
          discountRate,
          discountAmount,
          totalAmount,
          notes,
          terms,
          validUntil: validUntil ? new Date(validUntil) : null,
          status: 'DRAFT'
        }
      })

      // Create quote items
      if (items && items.length > 0) {
        const quoteItems = await Promise.all(
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
                quoteId: newQuote.id,
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

      // Create initial status log
      await tx.quoteStatusLog.create({
        data: {
          quoteId: newQuote.id,
          status: 'DRAFT',
          changedBy: agentId,
          notes: 'Quote created'
        }
      })

      return newQuote
    })

    // Fetch the complete quote with relations
    const completeQuote = await prisma.quote.findUnique({
      where: { id: quote.id },
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
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    return NextResponse.json(completeQuote, { status: 201 })
  } catch (error) {
    console.error('Error creating quote:', error)
    return NextResponse.json(
      { error: 'Failed to create quote' },
      { status: 500 }
    )
  }
}