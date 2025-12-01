import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/invoices - List invoices with filters, search, and pagination
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'
    const agentId = searchParams.get('agentId') || 'all'
    const clientId = searchParams.get('clientId') || 'all'
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // Build where clause for filtering
    const whereClause: Prisma.InvoiceWhereInput = {}

    // Search across invoice fields and related client
    if (search) {
      whereClause.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { quote: { number: { contains: search, mode: 'insensitive' } } },
        { client: {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { company: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
          ]
        }}
      ]
    }

    // Status filter
    if (status !== 'all') {
      whereClause.status = status as any
    }

    // Agent filter
    if (agentId !== 'all') {
      whereClause.agentId = agentId
    }

    // Client filter
    if (clientId !== 'all') {
      whereClause.clientId = clientId
    }

    // Build orderBy clause
    let orderBy: Prisma.InvoiceOrderByWithRelationInput = {}
    switch (sortBy) {
      case 'client':
        orderBy = { client: { name: sortOrder as 'asc' | 'desc' } }
        break
      case 'agent':
        orderBy = { agent: { name: sortOrder as 'asc' | 'desc' } }
        break
      case 'quote':
        orderBy = { quote: { number: sortOrder as 'asc' | 'desc' } }
        break
      case 'totalAmount':
        orderBy = { totalAmount: sortOrder as 'asc' | 'desc' }
        break
      case 'dueDate':
        orderBy = { dueDate: sortOrder as 'asc' | 'desc' }
        break
      case 'paidDate':
        orderBy = { paidDate: sortOrder as 'asc' | 'desc' }
        break
      case 'status':
        orderBy = { status: sortOrder as 'asc' | 'desc' }
        break
      default:
        orderBy = { createdAt: sortOrder as 'asc' | 'desc' }
    }

    // Get invoices with relations
    const [invoices, totalCount] = await Promise.all([
      prisma.invoice.findMany({
        where: whereClause,
        include: {
          client: {
            select: { id: true, name: true, company: true, email: true }
          },
          agent: {
            select: { id: true, name: true, email: true }
          },
          quote: {
            select: { id: true, number: true, status: true }
          },
          items: {
            include: {
              service: {
                select: { id: true, name: true, category: true }
              }
            }
          },
          bill: {
            select: { id: true, status: true, totalAmount: true }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.invoice.count({ where: whereClause })
    ])

    return NextResponse.json({
      invoices,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPreviousPage: page > 1
      }
    })
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}

// POST /api/invoices - Create a new invoice
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      quoteId,
      clientId,
      agentId,
      totalAmount,
      dueDate,
      items
    } = body

    // Validate required fields
    if (!clientId || !totalAmount || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId, totalAmount, items' },
        { status: 400 }
      )
    }

    // Create invoice with items in a transaction
    const invoice = await prisma.$transaction(async (tx) => {
      // Create the invoice
      const newInvoice = await tx.invoice.create({
        data: {
          quoteId,
          clientId,
          agentId,
          totalAmount,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          status: 'PENDING'
        }
      })

      // Create invoice items
      const invoiceItems = await Promise.all(
        items.map((item: any) =>
          tx.invoiceItem.create({
            data: {
              invoiceId: newInvoice.id,
              serviceId: item.serviceId,
              quantity: item.quantity,
              rate: item.rate,
              lineTotal: item.quantity * item.rate
            }
          })
        )
      )

      // If this invoice is from a quote, update the quote status
      if (quoteId) {
        await tx.quote.update({
          where: { id: quoteId },
          data: { status: 'ACCEPTED' }
        })
      }

      return newInvoice
    })

    // Fetch the created invoice with relations
    const createdInvoice = await prisma.invoice.findUnique({
      where: { id: invoice.id },
      include: {
        client: {
          select: { id: true, name: true, company: true, email: true }
        },
        agent: {
          select: { id: true, name: true, email: true }
        },
        quote: {
          select: { id: true, number: true, status: true }
        },
        items: {
          include: {
            service: {
              select: { id: true, name: true, category: true }
            }
          }
        }
      }
    })

    return NextResponse.json(createdInvoice, { status: 201 })
  } catch (error) {
    console.error('Error creating invoice:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'An invoice for this quote already exists' },
          { status: 409 }
        )
      }
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: 'Referenced client, agent, or services not found' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}