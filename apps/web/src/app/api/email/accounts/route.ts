import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { imapClient, GODADDY_IMAP, GODADDY_SMTP, type ImapConfig, type SmtpConfig } from '@/lib/email'

// GET /api/email/accounts - List all email accounts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const accounts = await prisma.emailAccount.findMany({
      orderBy: { email: 'asc' },
      select: {
        id: true,
        email: true,
        displayName: true,
        provider: true,
        isActive: true,
        isDefault: true,
        syncEnabled: true,
        lastSyncAt: true,
        syncError: true,
        autoCreateTickets: true,
        signature: true,
        imapHost: true,
        imapPort: true,
        smtpHost: true,
        smtpPort: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            tickets: true,
          },
        },
      },
    })

    // Check connection status for each account
    const accountsWithStatus = accounts.map((account) => ({
      ...account,
      ticketCount: account._count.tickets,
      _count: undefined,
      hasValidSubscription: account.isActive,
      isAuthenticated: account.isActive,
    }))

    return NextResponse.json({ accounts: accountsWithStatus })
  } catch (error) {
    console.error('Failed to fetch email accounts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch email accounts' },
      { status: 500 }
    )
  }
}

// POST /api/email/accounts - Create IMAP/SMTP email account
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      email,
      displayName,
      password,
      imapHost = GODADDY_IMAP.host,
      imapPort = GODADDY_IMAP.port,
      smtpHost = GODADDY_SMTP.host,
      smtpPort = GODADDY_SMTP.port,
      provider = 'IMAP_SMTP',
    } = body

    if (!email || !displayName || !password) {
      return NextResponse.json(
        { error: 'Email, display name, and password are required' },
        { status: 400 }
      )
    }

    // Check if account already exists
    const existing = await prisma.emailAccount.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Email account already exists' },
        { status: 400 }
      )
    }

    // Test IMAP connection
    const imapConfig: ImapConfig = {
      user: email,
      password,
      host: imapHost,
      port: imapPort,
      tls: true,
    }

    const imapTest = await imapClient.testConnection(imapConfig)

    // Test SMTP connection
    const smtpConfig: SmtpConfig = {
      user: email,
      password,
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
    }

    const smtpTest = await imapClient.testSmtpConnection(smtpConfig)

    // If both tests pass, create the account
    if (imapTest.success && smtpTest.success) {
      const account = await prisma.emailAccount.create({
        data: {
          email: email.toLowerCase(),
          displayName,
          provider,
          isActive: true,
          syncEnabled: true,
          autoCreateTickets: true,
          imapHost,
          imapPort,
          imapPassword: password, // In production, encrypt this
          smtpHost,
          smtpPort,
          smtpPassword: password, // Same password for both typically
        },
        select: {
          id: true,
          email: true,
          displayName: true,
          provider: true,
          isActive: true,
          isDefault: true,
          syncEnabled: true,
          autoCreateTickets: true,
        },
      })

      return NextResponse.json({
        account,
        testResults: {
          imap: { success: true },
          smtp: { success: true },
        },
        message: 'Email account created successfully',
      })
    }

    // If tests fail, return errors without creating account
    return NextResponse.json({
      error: 'Connection test failed',
      testResults: {
        imap: imapTest,
        smtp: smtpTest,
      },
    }, { status: 400 })

  } catch (error) {
    console.error('Failed to create email account:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create email account' },
      { status: 500 }
    )
  }
}
