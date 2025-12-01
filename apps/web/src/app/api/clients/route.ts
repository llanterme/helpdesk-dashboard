import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@helpdesk/database'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const company = searchParams.get('company') || ''

    const skip = (page - 1) * limit

    const where: any = {}

    // Search across name, email, and company
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Filter by company if specified
    if (company) {
      where.company = { contains: company, mode: 'insensitive' }
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        include: {
          tickets: {
            where: { status: 'OPEN' },
            select: { id: true }
          },
          _count: {
            select: {
              tickets: true,
              quotes: true,
              invoices: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.client.count({ where })
    ])

    // Add computed fields
    const clientsWithStats = clients.map(client => ({
      ...client,
      activeTickets: client.tickets.length,
      totalTickets: client._count.tickets,
      totalQuotes: client._count.quotes,
      totalInvoices: client._count.invoices
    }))

    return NextResponse.json({
      clients: clientsWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { name, email, phone, company } = data

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Check for existing client with same email
    const existingClient = await prisma.client.findUnique({
      where: { email }
    })

    if (existingClient) {
      return NextResponse.json(
        { error: 'Client with this email already exists' },
        { status: 409 }
      )
    }

    const client = await prisma.client.create({
      data: {
        name,
        email,
        phone: phone || null,
        company: company || null
      },
      include: {
        _count: {
          select: {
            tickets: true,
            quotes: true,
            invoices: true
          }
        }
      }
    })

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    console.error('Error creating client:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}