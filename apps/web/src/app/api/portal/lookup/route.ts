import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const ref = searchParams.get('ref')
    const email = searchParams.get('email')

    if (!ref || !email) {
      return NextResponse.json(
        { error: 'Ticket reference and email are required' },
        { status: 400 }
      )
    }

    // Find ticket by ID and verify client email
    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ref,
        client: {
          email: email.toLowerCase(),
        },
      },
      select: {
        id: true,
        subject: true,
      },
    })

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found. Please check your reference number and email address.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ticketId: ticket.id,
      ticketReference: ticket.id,
    })
  } catch (error) {
    console.error('Portal lookup error:', error)
    return NextResponse.json(
      { error: 'Failed to lookup ticket' },
      { status: 500 }
    )
  }
}
