import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { microsoftGraph, lookupClient, getClientContext } from '@/lib/email'

// GET /api/email/inbox/[messageId] - Get full email content with client context
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messageId } = await params
    const searchParams = request.nextUrl.searchParams
    const accountId = searchParams.get('accountId')

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      )
    }

    // Get access token
    const accessToken = await microsoftGraph.getValidToken(accountId)

    // Fetch full email with headers
    const email = await microsoftGraph.getMessage(accessToken, messageId, true)

    // Fetch attachments
    let attachments: Array<{
      id: string
      name: string
      contentType: string
      size: number
      isInline: boolean
    }> = []

    if (email.hasAttachments) {
      const attachmentResponse = await microsoftGraph.getAttachments(
        accessToken,
        messageId
      )
      attachments = attachmentResponse.value.map((att) => ({
        id: att.id,
        name: att.name,
        contentType: att.contentType,
        size: att.size,
        isInline: att.isInline,
      }))
    }

    // Look up client by sender email
    const senderEmail = email.from.emailAddress.address.toLowerCase()
    const clientLookup = await lookupClient(senderEmail)

    // Get client context if found
    let clientContext = null
    if (clientLookup.client) {
      clientContext = await getClientContext(clientLookup.client.id)
    }

    // Check if email already has a ticket
    const existingMessage = await prisma.message.findFirst({
      where: {
        OR: [
          { emailMessageId: email.internetMessageId },
          { emailMessageId: messageId },
        ],
      },
      include: {
        ticket: {
          select: {
            id: true,
            subject: true,
            status: true,
            channel: true,
          },
        },
      },
    })

    return NextResponse.json({
      email: {
        id: email.id,
        internetMessageId: email.internetMessageId,
        conversationId: email.conversationId,
        subject: email.subject,
        from: {
          name: email.from.emailAddress.name,
          address: email.from.emailAddress.address,
        },
        to: email.toRecipients.map((r) => ({
          name: r.emailAddress.name,
          address: r.emailAddress.address,
        })),
        cc: email.ccRecipients?.map((r) => ({
          name: r.emailAddress.name,
          address: r.emailAddress.address,
        })) || [],
        body: email.body,
        bodyPreview: email.bodyPreview,
        receivedDateTime: email.receivedDateTime,
        sentDateTime: email.sentDateTime,
        isRead: email.isRead,
        hasAttachments: email.hasAttachments,
        attachments,
      },
      client: clientLookup.client,
      clientSource: clientLookup.source,
      clientContext,
      existingTicket: existingMessage?.ticket || null,
    })
  } catch (error) {
    console.error('Failed to fetch email:', error)
    return NextResponse.json(
      { error: 'Failed to fetch email' },
      { status: 500 }
    )
  }
}

// POST /api/email/inbox/[messageId] - Convert email to ticket
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messageId } = await params
    const body = await request.json()
    const { accountId, clientId, priority, agentId } = body

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      )
    }

    // Get access token
    const accessToken = await microsoftGraph.getValidToken(accountId)

    // Fetch full email
    const email = await microsoftGraph.getMessage(accessToken, messageId, true)

    // Fetch attachments
    let attachments
    if (email.hasAttachments) {
      const attachmentResponse = await microsoftGraph.getAttachments(
        accessToken,
        messageId
      )
      attachments = attachmentResponse.value
    }

    // Import processIncomingEmail
    const { processIncomingEmail } = await import('@/lib/email')

    // Process the email
    const result = await processIncomingEmail(accountId, email, attachments)

    // Update ticket with additional info if provided
    if (priority || agentId) {
      await prisma.ticket.update({
        where: { id: result.ticketId },
        data: {
          ...(priority && { priority }),
          ...(agentId && { agentId }),
        },
      })
    }

    // If a different client was specified, update
    if (clientId && clientId !== result.clientId) {
      await prisma.ticket.update({
        where: { id: result.ticketId },
        data: { clientId },
      })
    }

    // Mark email as read
    try {
      await microsoftGraph.markAsRead(accessToken, messageId, true)
    } catch (error) {
      console.warn('Failed to mark email as read:', error)
    }

    return NextResponse.json({
      ticketId: result.ticketId,
      messageId: result.messageId,
      isNewTicket: result.isNewTicket,
      clientId: clientId || result.clientId,
    })
  } catch (error) {
    console.error('Failed to convert email to ticket:', error)
    return NextResponse.json(
      { error: 'Failed to convert email to ticket' },
      { status: 500 }
    )
  }
}
