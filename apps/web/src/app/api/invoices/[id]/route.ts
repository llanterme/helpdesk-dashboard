import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

interface RouteParams {
  id: string
}

// GET /api/invoices/[id] - Get invoice by ID
export async function GET(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 }
      )
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            company: true,
            email: true,
            phone: true,
            address: true
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
        },
        bill: {
          select: {
            id: true,
            status: true,
            totalAmount: true,
            createdAt: true
          }
        }
      }
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    )
  }
}

// PUT /api/invoices/[id] - Update invoice
export async function PUT(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const { id } = params
    const body = await request.json()
    const {
      status,
      totalAmount,
      dueDate,
      paidDate,
      items
    } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 }
      )
    }

    // Check if invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
      include: { items: true }
    })

    if (!existingInvoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Update invoice in a transaction
    const updatedInvoice = await prisma.$transaction(async (tx) => {
      // Update the invoice
      const updated = await tx.invoice.update({
        where: { id },
        data: {
          status,
          totalAmount,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          paidDate: paidDate ? new Date(paidDate) : null
        }
      })

      // If items are provided, update them
      if (items && Array.isArray(items)) {
        // Delete existing items
        await tx.invoiceItem.deleteMany({
          where: { invoiceId: id }
        })

        // Create new items
        await Promise.all(
          items.map((item: any) =>
            tx.invoiceItem.create({
              data: {
                invoiceId: id,
                serviceId: item.serviceId,
                quantity: item.quantity,
                rate: item.rate,
                lineTotal: item.quantity * item.rate
              }
            })
          )
        )
      }

      return updated
    })

    // Fetch the updated invoice with relations
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            company: true,
            email: true
          }
        },
        agent: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        quote: {
          select: {
            id: true,
            number: true,
            status: true
          }
        },
        items: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                category: true
              }
            }
          }
        },
        bill: {
          select: {
            id: true,
            status: true,
            totalAmount: true
          }
        }
      }
    })

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Error updating invoice:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: 'Invoice or referenced items not found' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    )
  }
}

// DELETE /api/invoices/[id] - Delete invoice
export async function DELETE(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 }
      )
    }

    // Check if invoice exists and can be deleted
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
      include: { bill: true }
    })

    if (!existingInvoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Prevent deletion of paid invoices or invoices with bills
    if (existingInvoice.status === 'PAID') {
      return NextResponse.json(
        { error: 'Cannot delete paid invoices' },
        { status: 400 }
      )
    }

    if (existingInvoice.bill) {
      return NextResponse.json(
        { error: 'Cannot delete invoices that have been billed to agents' },
        { status: 400 }
      )
    }

    // Delete invoice in a transaction (items will be deleted due to cascade)
    await prisma.$transaction(async (tx) => {
      // Delete invoice items first (explicit cleanup)
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: id }
      })

      // Delete the invoice
      await tx.invoice.delete({
        where: { id }
      })

      // If invoice was created from a quote, reset quote status
      if (existingInvoice.quoteId) {
        await tx.quote.update({
          where: { id: existingInvoice.quoteId },
          data: { status: 'ACCEPTED' }
        })
      }
    })

    return NextResponse.json({ message: 'Invoice deleted successfully' })
  } catch (error) {
    console.error('Error deleting invoice:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: 'Invoice not found' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to delete invoice' },
      { status: 500 }
    )
  }
}