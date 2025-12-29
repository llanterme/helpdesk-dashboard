import { prisma } from '@/lib/prisma'
import { imapClient, type SmtpConfig } from './imap-client'
import { SenderType } from '@prisma/client'

export interface SendEmailParams {
  accountId: string
  to: string[]
  cc?: string[]
  bcc?: string[]
  subject: string
  body: string
  isHtml?: boolean
  ticketId?: string
  agentId?: string
  attachments?: Array<{
    name: string
    contentType: string
    contentBytes: string // Base64 encoded
  }>
  inReplyTo?: string // For threading
}

export interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

// Send email via SMTP and optionally record it in a ticket
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  try {
    const account = await prisma.emailAccount.findUnique({
      where: { id: params.accountId },
    })

    if (!account) {
      return { success: false, error: 'Email account not found' }
    }

    if (!account.isActive) {
      return { success: false, error: 'Email account is not active' }
    }

    if (!account.smtpHost || !account.smtpPassword) {
      return { success: false, error: 'SMTP not configured for this account' }
    }

    // Build SMTP config
    const smtpConfig: SmtpConfig = {
      user: account.email,
      password: account.smtpPassword,
      host: account.smtpHost,
      port: account.smtpPort || 465,
      secure: (account.smtpPort || 465) === 465,
    }

    // Prepare email body with signature
    let finalBody = params.body
    if (account.signature && params.isHtml !== false) {
      finalBody = `${params.body}<br><br>${account.signature}`
    }

    // Send via SMTP
    const result = await imapClient.sendEmail(smtpConfig, {
      from: {
        name: account.displayName || account.email,
        address: account.email,
      },
      to: params.to,
      cc: params.cc,
      bcc: params.bcc,
      subject: params.subject,
      html: params.isHtml !== false ? finalBody : undefined,
      text: params.isHtml === false ? finalBody : undefined,
      attachments: params.attachments?.map((att) => ({
        filename: att.name,
        contentType: att.contentType,
        content: Buffer.from(att.contentBytes, 'base64'),
      })),
      inReplyTo: params.inReplyTo,
    })

    // If linked to a ticket, create a message record
    let messageId: string | undefined
    if (params.ticketId) {
      const message = await prisma.message.create({
        data: {
          ticketId: params.ticketId,
          senderType: SenderType.AGENT,
          senderId: params.agentId,
          content: params.isHtml ? stripHtmlForPreview(params.body) : params.body,
          read: true,
          timestamp: new Date(),
          // Email fields
          emailMessageId: result.messageId,
          emailSubject: params.subject,
          emailFrom: account.email,
          emailTo: params.to,
          emailCc: params.cc || [],
          emailBcc: params.bcc || [],
          emailInReplyTo: params.inReplyTo,
          emailHtmlBody: finalBody,
        },
      })
      messageId = message.id

      // Update ticket timestamp
      await prisma.ticket.update({
        where: { id: params.ticketId },
        data: { updatedAt: new Date() },
      })
    }

    return { success: true, messageId }
  } catch (error) {
    console.error('Failed to send email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Send a reply to a ticket
export async function sendReply(params: {
  ticketId: string
  accountId: string
  agentId: string
  body: string
  isHtml?: boolean
  attachments?: Array<{
    name: string
    contentType: string
    contentBytes: string
  }>
}): Promise<SendEmailResult> {
  // Get ticket and last message for context
  const ticket = await prisma.ticket.findUnique({
    where: { id: params.ticketId },
    include: {
      client: true,
      messages: {
        orderBy: { timestamp: 'desc' },
        take: 1,
        where: { senderType: SenderType.CLIENT },
      },
    },
  })

  if (!ticket) {
    return { success: false, error: 'Ticket not found' }
  }

  const lastClientMessage = ticket.messages[0]
  const inReplyTo = lastClientMessage?.emailMessageId || undefined

  return sendEmail({
    accountId: params.accountId,
    to: [ticket.client.email],
    subject: `RE: ${ticket.subject}`,
    body: params.body,
    isHtml: params.isHtml,
    ticketId: params.ticketId,
    agentId: params.agentId,
    attachments: params.attachments,
    inReplyTo,
  })
}

// Send quote via email
export async function sendQuoteEmail(params: {
  quoteId: string
  accountId: string
  agentId: string
  subject?: string
  body?: string
  ticketId?: string
}): Promise<SendEmailResult> {
  const quote = await prisma.quote.findUnique({
    where: { id: params.quoteId },
    include: {
      client: true,
      items: {
        include: { service: true },
      },
    },
  })

  if (!quote) {
    return { success: false, error: 'Quote not found' }
  }

  const account = await prisma.emailAccount.findUnique({
    where: { id: params.accountId },
  })

  if (!account) {
    return { success: false, error: 'Email account not found' }
  }

  // Build quote summary HTML
  const itemsHtml = quote.items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.service.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">R${item.rate.toFixed(2)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">R${item.lineTotal.toFixed(2)}</td>
        </tr>`
    )
    .join('')

  const defaultBody = `
    <p>Dear ${quote.client.name},</p>

    <p>Please find below our quote for the requested services:</p>

    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <thead>
        <tr style="background-color: #f5f5f5;">
          <th style="padding: 8px; text-align: left;">Service</th>
          <th style="padding: 8px; text-align: center;">Qty</th>
          <th style="padding: 8px; text-align: right;">Rate</th>
          <th style="padding: 8px; text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3" style="padding: 8px; text-align: right;"><strong>Subtotal:</strong></td>
          <td style="padding: 8px; text-align: right;">R${quote.subtotal.toFixed(2)}</td>
        </tr>
        <tr>
          <td colspan="3" style="padding: 8px; text-align: right;">VAT (${quote.taxRate}%):</td>
          <td style="padding: 8px; text-align: right;">R${quote.taxAmount.toFixed(2)}</td>
        </tr>
        <tr style="background-color: #f5f5f5;">
          <td colspan="3" style="padding: 8px; text-align: right;"><strong>Total:</strong></td>
          <td style="padding: 8px; text-align: right;"><strong>R${quote.totalAmount.toFixed(2)}</strong></td>
        </tr>
      </tfoot>
    </table>

    ${quote.validUntil ? `<p>This quote is valid until ${new Date(quote.validUntil).toLocaleDateString('en-ZA')}.</p>` : ''}

    ${quote.notes ? `<p><strong>Notes:</strong><br>${quote.notes}</p>` : ''}

    <p>Please let us know if you have any questions or would like to proceed.</p>

    <p>Kind regards,<br>Easy Services Group</p>
  `

  const result = await sendEmail({
    accountId: params.accountId,
    to: [quote.client.email],
    subject: params.subject || `Quote ${quote.number} from Easy Services Group`,
    body: params.body || defaultBody,
    isHtml: true,
    ticketId: params.ticketId,
    agentId: params.agentId,
  })

  if (result.success) {
    // Update quote status to SENT
    await prisma.quote.update({
      where: { id: params.quoteId },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
    })

    // Log status change
    await prisma.quoteStatusLog.create({
      data: {
        quoteId: params.quoteId,
        status: 'SENT',
        changedBy: params.agentId,
        notes: 'Quote sent via email',
      },
    })
  }

  return result
}

// Send invoice via email
export async function sendInvoiceEmail(params: {
  invoiceId: string
  accountId: string
  agentId: string
  subject?: string
  body?: string
  ticketId?: string
  isReminder?: boolean
}): Promise<SendEmailResult> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: params.invoiceId },
    include: {
      client: true,
      items: {
        include: { service: true },
      },
    },
  })

  if (!invoice) {
    return { success: false, error: 'Invoice not found' }
  }

  // Check if overdue
  const isOverdue = invoice.dueDate && new Date(invoice.dueDate) < new Date() && invoice.status !== 'PAID'
  const daysOverdue = isOverdue && invoice.dueDate
    ? Math.floor((Date.now() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  // Build invoice summary HTML
  const itemsHtml = invoice.items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.service.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">R${item.rate.toFixed(2)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">R${item.lineTotal.toFixed(2)}</td>
        </tr>`
    )
    .join('')

  let defaultBody: string
  if (params.isReminder && isOverdue) {
    defaultBody = `
      <p>Dear ${invoice.client.name},</p>

      <p style="color: #dc2626;"><strong>Payment Reminder - ${daysOverdue} Days Overdue</strong></p>

      <p>This is a friendly reminder that invoice ${invoice.number} for <strong>R${invoice.totalAmount.toFixed(2)}</strong>
      was due on ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-ZA') : 'N/A'}.</p>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background-color: #f5f5f5;">
            <th style="padding: 8px; text-align: left;">Service</th>
            <th style="padding: 8px; text-align: center;">Qty</th>
            <th style="padding: 8px; text-align: right;">Rate</th>
            <th style="padding: 8px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr style="background-color: #fef2f2;">
            <td colspan="3" style="padding: 8px; text-align: right;"><strong>Amount Due:</strong></td>
            <td style="padding: 8px; text-align: right; color: #dc2626;"><strong>R${invoice.totalAmount.toFixed(2)}</strong></td>
          </tr>
        </tfoot>
      </table>

      <p>If payment has already been made, please disregard this reminder and accept our thanks.</p>

      <p>For any queries regarding this invoice, please don't hesitate to contact us.</p>

      <p>Kind regards,<br>Easy Services Group</p>
    `
  } else {
    defaultBody = `
      <p>Dear ${invoice.client.name},</p>

      <p>Please find below the invoice for services rendered:</p>

      <p><strong>Invoice Number:</strong> ${invoice.number}<br>
      ${invoice.dueDate ? `<strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString('en-ZA')}` : ''}</p>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background-color: #f5f5f5;">
            <th style="padding: 8px; text-align: left;">Service</th>
            <th style="padding: 8px; text-align: center;">Qty</th>
            <th style="padding: 8px; text-align: right;">Rate</th>
            <th style="padding: 8px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding: 8px; text-align: right;"><strong>Subtotal:</strong></td>
            <td style="padding: 8px; text-align: right;">R${invoice.subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="3" style="padding: 8px; text-align: right;">VAT (${invoice.taxRate}%):</td>
            <td style="padding: 8px; text-align: right;">R${invoice.taxAmount.toFixed(2)}</td>
          </tr>
          <tr style="background-color: #f5f5f5;">
            <td colspan="3" style="padding: 8px; text-align: right;"><strong>Total Due:</strong></td>
            <td style="padding: 8px; text-align: right;"><strong>R${invoice.totalAmount.toFixed(2)}</strong></td>
          </tr>
        </tfoot>
      </table>

      <p>Please remit payment by the due date to avoid any late fees.</p>

      <p>Thank you for your business.</p>

      <p>Kind regards,<br>Easy Services Group</p>
    `
  }

  const result = await sendEmail({
    accountId: params.accountId,
    to: [invoice.client.email],
    subject:
      params.subject ||
      (params.isReminder
        ? `Payment Reminder: Invoice ${invoice.number} - ${daysOverdue} Days Overdue`
        : `Invoice ${invoice.number} from Easy Services Group`),
    body: params.body || defaultBody,
    isHtml: true,
    ticketId: params.ticketId,
    agentId: params.agentId,
  })

  if (result.success && !params.isReminder && invoice.status === 'PENDING') {
    // Update invoice status to SENT
    await prisma.invoice.update({
      where: { id: params.invoiceId },
      data: { status: 'SENT' },
    })
  }

  return result
}

// Helper to strip HTML for preview/plain text storage
function stripHtmlForPreview(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500)
}
