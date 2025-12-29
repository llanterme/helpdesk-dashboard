import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { imapClient, type ImapConfig, type SmtpConfig } from '@/lib/email'

// GET /api/email/accounts/[id] - Get single account details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const account = await prisma.emailAccount.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        displayName: true,
        provider: true,
        isActive: true,
        isDefault: true,
        syncEnabled: true,
        autoCreateTickets: true,
        signature: true,
        imapHost: true,
        imapPort: true,
        smtpHost: true,
        smtpPort: true,
        lastSyncAt: true,
        syncError: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            tickets: true,
            emailTemplates: true,
          },
        },
      },
    })

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    return NextResponse.json({ account })
  } catch (error) {
    console.error('Failed to fetch email account:', error)
    return NextResponse.json(
      { error: 'Failed to fetch email account' },
      { status: 500 }
    )
  }
}

// PATCH /api/email/accounts/[id] - Update account settings
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const allowedFields = [
      'displayName',
      'isActive',
      'isDefault',
      'syncEnabled',
      'autoCreateTickets',
      'signature',
    ]

    const updateData: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    // Handle password update if provided
    if (body.password) {
      updateData.imapPassword = body.password
      updateData.smtpPassword = body.password

      // Test connection with new password
      const existingAccount = await prisma.emailAccount.findUnique({
        where: { id },
        select: { email: true, imapHost: true, imapPort: true, smtpHost: true, smtpPort: true },
      })

      if (existingAccount?.imapHost) {
        const imapConfig: ImapConfig = {
          user: existingAccount.email,
          password: body.password,
          host: existingAccount.imapHost,
          port: existingAccount.imapPort || 993,
          tls: true,
        }
        const imapTest = await imapClient.testConnection(imapConfig)
        if (!imapTest.success) {
          return NextResponse.json(
            { error: `IMAP connection failed: ${imapTest.error}` },
            { status: 400 }
          )
        }
      }
    }

    // If setting as default, unset other defaults
    if (updateData.isDefault === true) {
      await prisma.emailAccount.updateMany({
        where: { id: { not: id } },
        data: { isDefault: false },
      })
    }

    const account = await prisma.emailAccount.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        displayName: true,
        isActive: true,
        isDefault: true,
        syncEnabled: true,
        autoCreateTickets: true,
        signature: true,
      },
    })

    return NextResponse.json({ account })
  } catch (error) {
    console.error('Failed to update email account:', error)
    return NextResponse.json(
      { error: 'Failed to update email account' },
      { status: 500 }
    )
  }
}

// DELETE /api/email/accounts/[id] - Delete account
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const account = await prisma.emailAccount.findUnique({
      where: { id },
    })

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Delete the account
    await prisma.emailAccount.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete email account:', error)
    return NextResponse.json(
      { error: 'Failed to delete email account' },
      { status: 500 }
    )
  }
}
