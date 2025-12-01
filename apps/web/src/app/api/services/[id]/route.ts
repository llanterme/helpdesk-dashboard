import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/services/[id] - Get service details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const service = await prisma.service.findUnique({
      where: { id: params.id },
      include: {
        quoteItems: {
          include: {
            quote: {
              select: {
                id: true,
                number: true,
                client: {
                  select: {
                    name: true,
                    company: true
                  }
                }
              }
            }
          }
        },
        invoiceItems: {
          include: {
            invoice: {
              select: {
                id: true,
                number: true,
                client: {
                  select: {
                    name: true,
                    company: true
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            quoteItems: true,
            invoiceItems: true
          }
        }
      }
    })

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    return NextResponse.json(service)
  } catch (error) {
    console.error('Error fetching service:', error)
    return NextResponse.json({ error: 'Failed to fetch service' }, { status: 500 })
  }
}

// PUT /api/services/[id] - Update service
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, category, description, rate, unit, sku, active } = body

    // Check if service exists
    const existingService = await prisma.service.findUnique({
      where: { id: params.id }
    })

    if (!existingService) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    // Validation
    if (name !== undefined && !name?.trim()) {
      return NextResponse.json({ error: 'Service name cannot be empty' }, { status: 400 })
    }

    if (category !== undefined && !category?.trim()) {
      return NextResponse.json({ error: 'Category cannot be empty' }, { status: 400 })
    }

    if (rate !== undefined && (typeof rate !== 'number' || rate < 0)) {
      return NextResponse.json({ error: 'Valid rate is required' }, { status: 400 })
    }

    if (unit !== undefined && !unit?.trim()) {
      return NextResponse.json({ error: 'Unit cannot be empty' }, { status: 400 })
    }

    // Check if SKU is being changed and if it conflicts with existing SKU
    if (sku !== undefined && sku !== existingService.sku) {
      const existingSku = await prisma.service.findUnique({
        where: { sku: sku.trim() }
      })

      if (existingSku && existingSku.id !== params.id) {
        return NextResponse.json({ error: 'SKU already exists' }, { status: 400 })
      }
    }

    // Build update data
    const updateData: any = {}
    if (name !== undefined) updateData.name = name.trim()
    if (category !== undefined) updateData.category = category.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (rate !== undefined) updateData.rate = parseFloat(rate)
    if (unit !== undefined) updateData.unit = unit.trim()
    if (sku !== undefined) updateData.sku = sku.trim()
    if (active !== undefined) updateData.active = active

    const service = await prisma.service.update({
      where: { id: params.id },
      data: updateData,
      include: {
        _count: {
          select: {
            quoteItems: true,
            invoiceItems: true
          }
        }
      }
    })

    return NextResponse.json(service)
  } catch (error) {
    console.error('Error updating service:', error)
    return NextResponse.json({ error: 'Failed to update service' }, { status: 500 })
  }
}

// DELETE /api/services/[id] - Archive service (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if service exists
    const existingService = await prisma.service.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            quoteItems: true,
            invoiceItems: true
          }
        }
      }
    })

    if (!existingService) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    // Check if service is being used in quotes or invoices
    if (existingService._count.quoteItems > 0 || existingService._count.invoiceItems > 0) {
      // Soft delete - mark as inactive instead of deleting
      const service = await prisma.service.update({
        where: { id: params.id },
        data: { active: false },
        include: {
          _count: {
            select: {
              quoteItems: true,
              invoiceItems: true
            }
          }
        }
      })

      return NextResponse.json({
        message: 'Service archived due to existing usage',
        service
      })
    } else {
      // Hard delete if not used anywhere
      await prisma.service.delete({
        where: { id: params.id }
      })

      return NextResponse.json({
        message: 'Service deleted successfully'
      })
    }
  } catch (error) {
    console.error('Error deleting service:', error)
    return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 })
  }
}