import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/services/categories - Get service categories
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    // Get all categories with statistics
    const categories = await prisma.service.groupBy({
      by: ['category'],
      _count: {
        category: true
      },
      _avg: {
        rate: true
      },
      _min: {
        rate: true
      },
      _max: {
        rate: true
      },
      where: includeInactive ? {} : { active: true },
      orderBy: {
        category: 'asc'
      }
    })

    // Get active service count per category
    const activeServiceCounts = await prisma.service.groupBy({
      by: ['category'],
      _count: {
        category: true
      },
      where: { active: true }
    })

    // Combine data
    const categoryStats = categories.map(category => {
      const activeCount = activeServiceCounts.find(
        active => active.category === category.category
      )?._count.category || 0

      return {
        name: category.category,
        totalServices: category._count.category,
        activeServices: activeCount,
        inactiveServices: category._count.category - activeCount,
        averageRate: category._avg.rate || 0,
        minRate: category._min.rate || 0,
        maxRate: category._max.rate || 0,
        rateRange: {
          min: category._min.rate || 0,
          max: category._max.rate || 0,
          average: category._avg.rate || 0
        }
      }
    })

    // Get overall statistics
    const totalServices = await prisma.service.count()
    const activeServices = await prisma.service.count({ where: { active: true } })

    return NextResponse.json({
      categories: categoryStats,
      summary: {
        totalCategories: categoryStats.length,
        totalServices,
        activeServices,
        inactiveServices: totalServices - activeServices
      }
    })
  } catch (error) {
    console.error('Error fetching service categories:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

// POST /api/services/categories - Create/update category (bulk update services)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { oldCategory, newCategory, serviceIds } = body

    // Validation
    if (!newCategory?.trim()) {
      return NextResponse.json({ error: 'New category name is required' }, { status: 400 })
    }

    let updatedServices

    if (serviceIds && Array.isArray(serviceIds)) {
      // Update specific services to new category
      updatedServices = await prisma.service.updateMany({
        where: {
          id: { in: serviceIds }
        },
        data: {
          category: newCategory.trim()
        }
      })
    } else if (oldCategory) {
      // Update all services in old category to new category
      updatedServices = await prisma.service.updateMany({
        where: {
          category: oldCategory
        },
        data: {
          category: newCategory.trim()
        }
      })
    } else {
      return NextResponse.json(
        { error: 'Either oldCategory or serviceIds must be provided' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: `Successfully updated ${updatedServices.count} services to category "${newCategory}"`,
      updatedCount: updatedServices.count
    })
  } catch (error) {
    console.error('Error updating service categories:', error)
    return NextResponse.json({ error: 'Failed to update categories' }, { status: 500 })
  }
}

// DELETE /api/services/categories - Delete category (requires reassignment)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { category, newCategory } = body

    // Validation
    if (!category?.trim()) {
      return NextResponse.json({ error: 'Category to delete is required' }, { status: 400 })
    }

    if (!newCategory?.trim()) {
      return NextResponse.json({ error: 'New category for reassignment is required' }, { status: 400 })
    }

    // Check if category exists
    const existingServices = await prisma.service.count({
      where: { category }
    })

    if (existingServices === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Reassign all services to new category
    const updatedServices = await prisma.service.updateMany({
      where: { category },
      data: { category: newCategory.trim() }
    })

    return NextResponse.json({
      message: `Successfully reassigned ${updatedServices.count} services from "${category}" to "${newCategory}"`,
      reassignedCount: updatedServices.count
    })
  } catch (error) {
    console.error('Error deleting service category:', error)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}