import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { microsoftGraph } from '@/lib/email'
import crypto from 'crypto'

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
        subscriptionId: true,
        subscriptionExpiry: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            tickets: true,
          },
        },
      },
    })

    // Check subscription status for each account
    const accountsWithStatus = accounts.map((account) => ({
      ...account,
      ticketCount: account._count.tickets,
      _count: undefined,
      hasValidSubscription:
        account.subscriptionId &&
        account.subscriptionExpiry &&
        new Date(account.subscriptionExpiry) > new Date(),
      isAuthenticated: !!account.subscriptionId, // Has gone through OAuth
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

// POST /api/email/accounts - Start OAuth flow for new account
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { email, displayName, tenantId } = body

    if (!email || !displayName) {
      return NextResponse.json(
        { error: 'Email and display name are required' },
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

    // Create account record (pending OAuth)
    const account = await prisma.emailAccount.create({
      data: {
        email: email.toLowerCase(),
        displayName,
        provider: 'MICROSOFT_365',
        isActive: false, // Will be activated after OAuth
        tenantId: tenantId || 'common',
      },
    })

    // Generate state token for OAuth
    const state = crypto.randomBytes(32).toString('hex')

    // Store state in account for verification (temporary, will be cleared after callback)
    await prisma.emailAccount.update({
      where: { id: account.id },
      data: {
        syncError: JSON.stringify({ oauthState: state, accountId: account.id }),
      },
    })

    // Generate authorization URL
    const authUrl = microsoftGraph.getAuthorizationUrl(state, tenantId || 'common')

    return NextResponse.json({
      account: {
        id: account.id,
        email: account.email,
        displayName: account.displayName,
      },
      authUrl,
      message: 'Redirect user to authUrl to complete OAuth',
    })
  } catch (error) {
    console.error('Failed to create email account:', error)
    return NextResponse.json(
      { error: 'Failed to create email account' },
      { status: 500 }
    )
  }
}
