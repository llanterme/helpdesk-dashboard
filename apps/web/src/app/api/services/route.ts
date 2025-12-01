import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/services - List services with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const active = searchParams.get('active')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'name'
    const sortOrder = searchParams.get('sortOrder') || 'asc'

    // Build filter conditions
    const where: any = {}

    if (category && category !== 'all') {
      where.category = category
    }

    if (active !== null) {
      where.active = active === 'true'
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Build sort options
    const orderBy: any = {}
    orderBy[sortBy] = sortOrder

    const services = await prisma.service.findMany({
      where,
      orderBy,
      include: {
        _count: {
          select: {
            quoteItems: true,
            invoiceItems: true
          }
        }
      }
    })

    // Get category statistics
    const categories = await prisma.service.groupBy({
      by: ['category'],
      _count: {
        category: true
      },
      where: { active: true }
    })

    return NextResponse.json({
      services,
      categories: categories.map(c => ({
        name: c.category,
        count: c._count.category
      })),
      pagination: {
        total: services.length,
        page: 1,
        pageSize: services.length
      }
    })
  } catch (error) {
    console.error('Error fetching services:', error)
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 })
  }
}

// POST /api/services - Create new service
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, category, description, rate, unit, sku, active } = body

    // Validation
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Service name is required' }, { status: 400 })
    }

    if (!category?.trim()) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 })
    }

    if (typeof rate !== 'number' || rate < 0) {
      return NextResponse.json({ error: 'Valid rate is required' }, { status: 400 })
    }

    if (!unit?.trim()) {
      return NextResponse.json({ error: 'Unit is required' }, { status: 400 })
    }

    // Generate SKU if not provided
    let serviceSku = sku?.trim()
    if (!serviceSku) {
      const categoryPrefix = category.substring(0, 3).toUpperCase()
      const namePrefix = name.substring(0, 3).toUpperCase()
      const timestamp = Date.now().toString().slice(-6)
      serviceSku = `${categoryPrefix}-${namePrefix}-${timestamp}`
    }

    // Check if SKU already exists
    const existingSku = await prisma.service.findUnique({
      where: { sku: serviceSku }
    })

    if (existingSku) {
      return NextResponse.json({ error: 'SKU already exists' }, { status: 400 })
    }

    const service = await prisma.service.create({
      data: {
        name: name.trim(),
        category: category.trim(),
        description: description?.trim() || null,
        rate: parseFloat(rate),
        unit: unit.trim(),
        sku: serviceSku,
        active: active !== false // Default to true if not specified
      },
      include: {
        _count: {
          select: {
            quoteItems: true,
            invoiceItems: true
          }
        }
      }
    })

    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    console.error('Error creating service:', error)
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 })
  }
}