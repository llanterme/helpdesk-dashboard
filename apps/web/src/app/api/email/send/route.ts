import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail, sendReply, sendQuoteEmail, sendInvoiceEmail } from '@/lib/email'

// POST /api/email/send - Send email
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type } = body

    // Get agent ID from session
    const agent = await prisma.agent.findFirst({
      where: {
        OR: [
          { userId: session.user.id },
          { email: session.user.email || '' },
        ],
      },
    })

    const agentId = agent?.id

    switch (type) {
      case 'reply': {
        // Reply to a ticket
        const { ticketId, accountId, body: replyBody, isHtml, attachments } = body

        if (!ticketId || !accountId || !replyBody) {
          return NextResponse.json(
            { error: 'ticketId, accountId, and body are required' },
            { status: 400 }
          )
        }

        const result = await sendReply({
          ticketId,
          accountId,
          agentId: agentId || '',
          body: replyBody,
          isHtml,
          attachments,
        })

        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          messageId: result.messageId,
        })
      }

      case 'quote': {
        // Send quote email
        const { quoteId, accountId, subject, body: emailBody, ticketId } = body

        if (!quoteId || !accountId) {
          return NextResponse.json(
            { error: 'quoteId and accountId are required' },
            { status: 400 }
          )
        }

        const result = await sendQuoteEmail({
          quoteId,
          accountId,
          agentId: agentId || '',
          subject,
          body: emailBody,
          ticketId,
        })

        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          messageId: result.messageId,
        })
      }

      case 'invoice': {
        // Send invoice email
        const { invoiceId, accountId, subject, body: emailBody, ticketId, isReminder } = body

        if (!invoiceId || !accountId) {
          return NextResponse.json(
            { error: 'invoiceId and accountId are required' },
            { status: 400 }
          )
        }

        const result = await sendInvoiceEmail({
          invoiceId,
          accountId,
          agentId: agentId || '',
          subject,
          body: emailBody,
          ticketId,
          isReminder,
        })

        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          messageId: result.messageId,
        })
      }

      case 'compose':
      default: {
        // Compose new email
        const {
          accountId,
          to,
          cc,
          bcc,
          subject,
          body: emailBody,
          isHtml,
          ticketId,
          attachments,
          inReplyTo,
        } = body

        if (!accountId || !to || !subject || !emailBody) {
          return NextResponse.json(
            { error: 'accountId, to, subject, and body are required' },
            { status: 400 }
          )
        }

        const result = await sendEmail({
          accountId,
          to: Array.isArray(to) ? to : [to],
          cc,
          bcc,
          subject,
          body: emailBody,
          isHtml,
          ticketId,
          agentId,
          attachments,
          inReplyTo,
        })

        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          messageId: result.messageId,
        })
      }
    }
  } catch (error) {
    console.error('Failed to send email:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}
