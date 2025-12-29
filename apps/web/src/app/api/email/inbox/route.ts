import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { imapClient, type ImapConfig } from '@/lib/email'

// GET /api/email/inbox - Get emails from configured IMAP accounts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const accountId = searchParams.get('accountId')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const limit = parseInt(searchParams.get('limit') || '25')
    const folder = searchParams.get('folder') || 'INBOX'

    // Get active accounts with IMAP credentials
    const accountFilter = accountId
      ? { id: accountId, isActive: true }
      : { isActive: true }

    const accounts = await prisma.emailAccount.findMany({
      where: accountFilter,
      select: {
        id: true,
        email: true,
        displayName: true,
        imapHost: true,
        imapPort: true,
        imapPassword: true,
      },
    })

    if (accounts.length === 0) {
      return NextResponse.json({
        emails: [],
        total: 0,
      })
    }

    // Fetch emails from each account
    const allEmails: Array<{
      id: string
      uid: string
      accountId: string
      accountEmail: string
      subject: string
      from: { name: string; address: string }
      to: Array<{ name: string; address: string }>
      bodyPreview: string
      receivedDateTime: string
      isRead: boolean
      hasAttachments: boolean
    }> = []

    for (const account of accounts) {
      if (!account.imapHost || !account.imapPassword) continue

      try {
        const imapConfig: ImapConfig = {
          user: account.email,
          password: account.imapPassword,
          host: account.imapHost,
          port: account.imapPort || 993,
          tls: true,
        }

        const emails = await imapClient.fetchEmails(imapConfig, {
          folder,
          limit,
          unseen: unreadOnly,
        })

        // Add account info to each email
        for (const email of emails) {
          allEmails.push({
            id: `${account.id}_${email.uid}`,
            uid: email.uid,
            accountId: account.id,
            accountEmail: account.email,
            subject: email.subject || '(No Subject)',
            from: email.from,
            to: email.to,
            bodyPreview: email.textBody?.substring(0, 200) || '',
            receivedDateTime: email.date.toISOString(),
            isRead: email.flags.includes('\\Seen'),
            hasAttachments: email.attachments.length > 0,
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
    })
  } catch (error) {
    console.error('Failed to fetch inbox:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inbox' },
      { status: 500 }
    )
  }
}
