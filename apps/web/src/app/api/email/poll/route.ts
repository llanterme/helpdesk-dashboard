import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { imapClient, type ImapConfig, processImapEmail } from '@/lib/email'

// POST /api/email/poll - Poll for new emails and process them
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { accountId } = body

    // Get active accounts with IMAP credentials
    const accountFilter = accountId
      ? { id: accountId, isActive: true, syncEnabled: true }
      : { isActive: true, syncEnabled: true }

    const accounts = await prisma.emailAccount.findMany({
      where: accountFilter,
      select: {
        id: true,
        email: true,
        displayName: true,
        imapHost: true,
        imapPort: true,
        imapPassword: true,
        autoCreateTickets: true,
        lastSyncAt: true,
      },
    })

    if (accounts.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        message: 'No active accounts to poll',
      })
    }

    const results = {
      processed: 0,
      newTickets: 0,
      newMessages: 0,
      errors: [] as string[],
    }

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

        // Fetch only unseen emails
        const emails = await imapClient.fetchEmails(imapConfig, {
          folder: 'INBOX',
          limit: 50,
          unseen: true,
        })

        for (const email of emails) {
          // Check if we've already processed this email
          const existingMessage = await prisma.message.findFirst({
            where: { emailMessageId: email.messageId },
          })

          if (existingMessage) {
            continue // Skip already processed emails
          }

          // Process the email if auto-create tickets is enabled
          if (account.autoCreateTickets) {
            try {
              const result = await processImapEmail(account.id, {
                messageId: email.messageId,
                subject: email.subject,
                from: email.from,
                to: email.to,
                cc: email.cc,
                date: email.date,
                textBody: email.textBody,
                htmlBody: email.htmlBody,
                inReplyTo: email.inReplyTo,
                references: email.references,
                attachments: email.attachments.map((att) => ({
                  filename: att.filename,
                  contentType: att.contentType,
                  size: att.size,
                })),
              })

              results.processed++
              if (result.isNewTicket) results.newTickets++
              else results.newMessages++

              // Mark email as read in IMAP
              await imapClient.markAsRead(imapConfig, email.uid)
            } catch (processError) {
              console.error(`Failed to process email from ${email.from.address}:`, processError)
              results.errors.push(`Failed to process email: ${email.subject}`)
            }
          }
        }

        // Update last sync time
        await prisma.emailAccount.update({
          where: { id: account.id },
          data: {
            lastSyncAt: new Date(),
            syncError: null,
          },
        })
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        console.error(`Failed to poll ${account.email}:`, error)
        results.errors.push(`${account.email}: ${errorMsg}`)

        // Update sync error
        await prisma.emailAccount.update({
          where: { id: account.id },
          data: { syncError: errorMsg },
        })
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
    })
  } catch (error) {
    console.error('Failed to poll emails:', error)
    return NextResponse.json(
      { error: 'Failed to poll emails' },
      { status: 500 }
    )
  }
}
