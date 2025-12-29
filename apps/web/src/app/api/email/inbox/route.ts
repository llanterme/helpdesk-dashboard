import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { microsoftGraph } from '@/lib/email'

// GET /api/email/inbox - Get emails from configured accounts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const accountId = searchParams.get('accountId')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const search = searchParams.get('search')

    // Get active accounts
    const accountFilter = accountId
      ? { id: accountId, isActive: true }
      : { isActive: true }

    const accounts = await prisma.emailAccount.findMany({
      where: accountFilter,
      select: {
        id: true,
        email: true,
        displayName: true,
        accessToken: true,
        refreshToken: true,
        tokenExpiry: true,
        tenantId: true,
      },
    })

    if (accounts.length === 0) {
      return NextResponse.json({
        emails: [],
        total: 0,
        page,
        totalPages: 0,
      })
    }

    // Fetch emails from each account
    const allEmails: Array<{
      id: string
      accountId: string
      accountEmail: string
      subject: string
      from: { name: string; address: string }
      to: Array<{ name: string; address: string }>
      bodyPreview: string
      receivedDateTime: string
      isRead: boolean
      hasAttachments: boolean
      conversationId: string
    }> = []

    for (const account of accounts) {
      if (!account.accessToken || !account.refreshToken) continue

      try {
        const accessToken = await microsoftGraph.getValidToken(account.id)

        // Build filter
        let filter = ''
        if (unreadOnly) {
          filter = 'isRead eq false'
        }
        if (search) {
          const searchFilter = `(contains(subject,'${search}') or contains(from/emailAddress/address,'${search}') or contains(bodyPreview,'${search}'))`
          filter = filter ? `${filter} and ${searchFilter}` : searchFilter
        }

        const response = await microsoftGraph.listMessages(accessToken, {
          top: limit,
          skip: (page - 1) * limit,
          filter: filter || undefined,
          orderBy: 'receivedDateTime desc',
          select: [
            'id',
            'subject',
            'from',
            'toRecipients',
            'bodyPreview',
            'receivedDateTime',
            'isRead',
            'hasAttachments',
            'conversationId',
          ],
        })

        // Add account info to each email
        for (const email of response.value) {
          allEmails.push({
            id: email.id,
            accountId: account.id,
            accountEmail: account.email,
            subject: email.subject || '(No Subject)',
            from: {
              name: email.from.emailAddress.name,
              address: email.from.emailAddress.address,
            },
            to: email.toRecipients.map((r) => ({
              name: r.emailAddress.name,
              address: r.emailAddress.address,
            })),
            bodyPreview: email.bodyPreview,
            receivedDateTime: email.receivedDateTime,
            isRead: email.isRead,
            hasAttachments: email.hasAttachments,
            conversationId: email.conversationId,
          })
        }
      } catch (error) {
        console.error(`Failed to fetch emails from ${account.email}:`, error)
        // Continue with other accounts
      }
    }

    // Sort all emails by date (newest first)
    allEmails.sort(
      (a, b) =>
        new Date(b.receivedDateTime).getTime() -
        new Date(a.receivedDateTime).getTime()
    )

    return NextResponse.json({
      emails: allEmails.slice(0, limit),
      total: allEmails.length,
      page,
      totalPages: Math.ceil(allEmails.length / limit),
    })
  } catch (error) {
    console.error('Failed to fetch inbox:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inbox' },
      { status: 500 }
    )
  }
}
