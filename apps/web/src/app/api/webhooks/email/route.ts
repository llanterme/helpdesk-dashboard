import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { microsoftGraph, processIncomingEmail } from '@/lib/email'

interface GraphNotification {
  subscriptionId: string
  subscriptionExpirationDateTime: string
  changeType: string
  resource: string
  resourceData: {
    '@odata.type': string
    '@odata.id': string
    '@odata.etag': string
    id: string
  }
  clientState: string
  tenantId: string
}

interface GraphNotificationPayload {
  value: GraphNotification[]
}

// POST /api/webhooks/email - Microsoft Graph webhook for new emails
export async function POST(request: NextRequest) {
  try {
    // Check for validation token (subscription validation request)
    const validationToken = request.nextUrl.searchParams.get('validationToken')
    if (validationToken) {
      // Microsoft sends this when creating/renewing subscription
      // Must respond with the token in plain text
      return new NextResponse(validationToken, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      })
    }

    // Parse notification payload
    const payload: GraphNotificationPayload = await request.json()

    if (!payload.value || !Array.isArray(payload.value)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Process each notification
    for (const notification of payload.value) {
      try {
        await processNotification(notification)
      } catch (error) {
        console.error('Failed to process notification:', error)
        // Continue processing other notifications
      }
    }

    // Must respond with 202 Accepted for Graph webhooks
    return new NextResponse(null, { status: 202 })
  } catch (error) {
    console.error('Webhook error:', error)
    // Still return 202 to prevent retries for invalid payloads
    return new NextResponse(null, { status: 202 })
  }
}

async function processNotification(notification: GraphNotification) {
  // Find the email account by subscription ID
  const account = await prisma.emailAccount.findFirst({
    where: { subscriptionId: notification.subscriptionId },
  })

  if (!account) {
    console.warn('No account found for subscription:', notification.subscriptionId)
    return
  }

  if (!account.isActive || !account.syncEnabled) {
    console.log('Account is inactive or sync disabled:', account.email)
    return
  }

  if (!account.autoCreateTickets) {
    console.log('Auto-create tickets disabled for:', account.email)
    return
  }

  // Get valid access token
  const accessToken = await microsoftGraph.getValidToken(account.id)

  // Extract message ID from resource
  // Resource format: /me/mailFolders/inbox/messages/{id}
  const messageIdMatch = notification.resource.match(/messages\/([^\/]+)/)
  if (!messageIdMatch) {
    console.warn('Could not extract message ID from resource:', notification.resource)
    return
  }

  const graphMessageId = messageIdMatch[1]

  // Check if we've already processed this message
  const existingMessage = await prisma.message.findFirst({
    where: {
      OR: [
        { emailMessageId: graphMessageId },
        // Also check by the actual Internet Message-ID header if available
      ],
    },
  })

  if (existingMessage) {
    console.log('Message already processed:', graphMessageId)
    return
  }

  // Fetch full email content
  const email = await microsoftGraph.getMessage(accessToken, graphMessageId, true)

  // Skip if sent by our own account (outgoing email)
  const senderEmail = email.from.emailAddress.address.toLowerCase()
  const accountEmail = account.email.toLowerCase()
  if (senderEmail === accountEmail) {
    console.log('Skipping outgoing email from:', senderEmail)
    return
  }

  // Fetch attachments if present
  let attachments
  if (email.hasAttachments) {
    const attachmentResponse = await microsoftGraph.getAttachments(
      accessToken,
      graphMessageId
    )
    attachments = attachmentResponse.value
  }

  // Process the email (create ticket/message)
  const result = await processIncomingEmail(account.id, email, attachments)

  console.log('Processed email:', {
    accountEmail: account.email,
    senderEmail,
    subject: email.subject,
    ticketId: result.ticketId,
    isNewTicket: result.isNewTicket,
    isNewClient: result.isNewClient,
  })

  // Mark email as read in Graph (optional)
  try {
    await microsoftGraph.markAsRead(accessToken, graphMessageId, true)
  } catch (error) {
    console.warn('Failed to mark email as read:', error)
  }

  // Update last sync time
  await prisma.emailAccount.update({
    where: { id: account.id },
    data: { lastSyncAt: new Date() },
  })
}
