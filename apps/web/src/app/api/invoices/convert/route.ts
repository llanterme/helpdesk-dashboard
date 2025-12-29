import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

// POST /api/invoices/convert - Convert quote to invoice
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { quoteId, dueDate, agentId } = body

    if (!quoteId) {
      return NextResponse.json(
        { error: 'Quote ID is required' },
        { status: 400 }
      )
    }

    // Check if quote exists and can be converted
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        items: {
          include: {
            service: true
          }
        },
        client: true,
        agent: true,
        invoice: true // Check if already has an invoice
      }
    })

    if (!quote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      )
    }

    // Check if quote is in correct status for conversion
    if (quote.status !== 'ACCEPTED') {
      return NextResponse.json(
        { error: 'Only accepted quotes can be converted to invoices' },
        { status: 400 }
      )
    }

    // Check if quote already has an invoice
    if (quote.invoice) {
      return NextResponse.json(
        { error: 'Quote has already been converted to an invoice' },
        { status: 409 }
      )
    }

    // Check if quote items exist
    if (!quote.items || quote.items.length === 0) {
      return NextResponse.json(
        { error: 'Quote must have items to convert to invoice' },
        { status: 400 }
      )
    }

    // Convert quote to invoice in a transaction
    const invoice = await prisma.$transaction(async (tx) => {
      // Create the invoice
      const newInvoice = await tx.invoice.create({
        data: {
          quoteId: quote.id,
          clientId: quote.clientId,
          agentId: agentId || quote.agentId,
          totalAmount: quote.totalAmount,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          status: 'PENDING'
        }
      })

      // Create invoice items from quote items
      const invoiceItems = await Promise.all(
        quote.items.map(item =>
          tx.invoiceItem.create({
            data: {
              invoiceId: newInvoice.id,
              serviceId: item.serviceId,
              quantity: item.quantity,
              rate: item.rate,
              lineTotal: item.lineTotal
            }
          })
        )
      )

      return newInvoice
    })

    // Fetch the created invoice with all relations
    const createdInvoice = await prisma.invoice.findUnique({
      where: { id: invoice.id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            company: true,
            email: true,
            phone: true
          }
        },
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        quote: {
          select: {
            id: true,
            number: true,
            status: true,
            notes: true,
            terms: true
          }
        },
        items: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                category: true,
                description: true,
                unit: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(createdInvoice, { status: 201 })
  } catch (error) {
    console.error('Error converting quote to invoice:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'An invoice for this quote already exists' },
          { status: 409 }
        )
      }
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: 'Quote or referenced data not found' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to convert quote to invoice' },
      { status: 500 }
    )
  }
}