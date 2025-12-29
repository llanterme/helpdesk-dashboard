import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/email/templates - List email templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const accountId = searchParams.get('accountId')

    const where: Record<string, unknown> = {}
    if (category) where.category = category
    if (accountId) where.emailAccountId = accountId

    const templates = await prisma.emailTemplate.findMany({
      where,
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
      include: {
        emailAccount: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Failed to fetch templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

// POST /api/email/templates - Create new template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, subject, templateBody, category, emailAccountId, isDefault } = body

    if (!name || !subject || !templateBody) {
      return NextResponse.json(
        { error: 'Name, subject, and body are required' },
        { status: 400 }
      )
    }

    // If setting as default, unset other defaults in same category
    if (isDefault && category) {
      await prisma.emailTemplate.updateMany({
        where: { category },
        data: { isDefault: false },
      })
    }

    const template = await prisma.emailTemplate.create({
      data: {
        name,
        subject,
        body: templateBody,
        category,
        emailAccountId,
        isDefault: isDefault || false,
      },
    })

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Failed to create template:', error)
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    )
  }
}
