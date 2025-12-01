import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// Helper function to generate invoice number
function generateInvoiceNumber(): string {
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0')
  return `INV-${timestamp}${random}`
}

// POST /api/quotes/[id]/convert - Convert quote to invoice
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
    const { dueDate, agentId } = body

    // Check if quote exists and can be converted
    const quote = await prisma.quote.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            service: true
          }
        },
        invoice: true,
        client: true
      }
    })

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    // Check if quote is already converted
    if (quote.invoice) {
      return NextResponse.json(
        { error: 'Quote has already been converted to an invoice' },
        { status: 400 }
      )
    }

    // Only accepted quotes can be converted
    if (quote.status !== 'ACCEPTED') {
      return NextResponse.json(
        { error: 'Only accepted quotes can be converted to invoices' },
        { status: 400 }
      )
    }

    // Validate due date
    if (dueDate && new Date(dueDate) <= new Date()) {
      return NextResponse.json(
        { error: 'Due date must be in the future' },
        { status: 400 }
      )
    }

    // Generate unique invoice number
    let invoiceNumber: string
    let isUnique = false
    do {
      invoiceNumber = generateInvoiceNumber()
      const existing = await prisma.invoice.findFirst({
        where: {
          OR: [
            { id: invoiceNumber },
            // You might want to add a number field to Invoice model later
          ]
        }
      })
      isUnique = !existing
    } while (!isUnique)

    // Create invoice from quote in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the invoice
      const invoice = await tx.invoice.create({
        data: {
          quoteId: params.id,
          clientId: quote.clientId,
          agentId: agentId || quote.agentId,
          totalAmount: quote.totalAmount,
          dueDate: dueDate ? new Date(dueDate) : null,
          status: 'PENDING'
        }
      })

      // Create invoice items from quote items
      const invoiceItems = await Promise.all(
        quote.items.map((quoteItem) =>
          tx.invoiceItem.create({
            data: {
              invoiceId: invoice.id,
              serviceId: quoteItem.serviceId,
              quantity: quoteItem.quantity,
              rate: quoteItem.rate,
              lineTotal: quoteItem.lineTotal
            }
          })
        )
      )

      // Update quote status if it's still ACCEPTED
      if (quote.status === 'ACCEPTED') {
        await tx.quote.update({
          where: { id: params.id },
          data: {
            // Quote remains ACCEPTED but now has an invoice
          }
        })
      }

      // Create status log for the conversion
      await tx.quoteStatusLog.create({
        data: {
          quoteId: params.id,
          status: quote.status, // Keep current status
          changedBy: agentId || quote.agentId,
          notes: `Converted to Invoice ${invoice.id}`
        }
      })

      return { invoice, invoiceItems }
    })

    // Fetch the complete invoice with relations
    const completeInvoice = await prisma.invoice.findUnique({
      where: { id: result.invoice.id },
      include: {
        quote: {
          select: {
            id: true,
            number: true,
            status: true,
            createdAt: true
          }
        },
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
        }
      }
    })

    return NextResponse.json({
      invoice: completeInvoice,
      message: 'Quote successfully converted to invoice'
    }, { status: 201 })
  } catch (error) {
    console.error('Error converting quote to invoice:', error)
    return NextResponse.json(
      { error: 'Failed to convert quote to invoice' },
      { status: 500 }
    )
  }
}