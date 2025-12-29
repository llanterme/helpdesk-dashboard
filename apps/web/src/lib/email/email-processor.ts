import { prisma } from '@/lib/prisma'
import { microsoftGraph, GraphEmail, GraphAttachment } from './microsoft-graph'
import { TicketChannel, TicketStatus, SenderType } from '@prisma/client'
import { zohoBooks, zohoCrm } from '@/lib/zoho'

export interface ProcessedEmail {
  ticketId: string
  messageId: string
  isNewTicket: boolean
  clientId: string
  isNewClient: boolean
}

export interface ClientLookupResult {
  client: {
    id: string
    name: string
    email: string
    phone: string | null
    company: string | null
    zohoCrmContactId: string | null
    zohoBooksContactId: string | null
  } | null
  source: 'local' | 'zoho_crm' | 'zoho_books' | 'new'
}

// Strip email signatures and quoted text
export function stripEmailContent(html: string): string {
  // Remove common email client signatures
  let content = html

  // Remove outlook signature dividers
  content = content.replace(/<div[^>]*class="[^"]*OutlookSignature[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')

  // Remove gmail signature dividers
  content = content.replace(/<div[^>]*class="[^"]*gmail_signature[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')

  // Remove quoted text markers
  content = content.replace(/<blockquote[^>]*>[\s\S]*?<\/blockquote>/gi, '')

  // Remove "On X wrote:" patterns
  content = content.replace(/<div[^>]*>On .+ wrote:<\/div>/gi, '')

  // Remove horizontal rules that often precede quotes
  content = content.replace(/<hr[^>]*>[\s\S]*$/gi, '')

  // Remove "From:" reply headers
  content = content.replace(/<div[^>]*>From:[\s\S]*?Subject:[\s\S]*?<\/div>/gi, '')

  // Remove empty paragraphs
  content = content.replace(/<p[^>]*>\s*<\/p>/gi, '')
  content = content.replace(/<div[^>]*>\s*<\/div>/gi, '')

  return content.trim()
}

// Convert HTML to plain text
export function htmlToPlainText(html: string): string {
  // Remove script and style tags
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')

  // Replace block elements with newlines
  text = text.replace(/<\/(p|div|br|h[1-6]|li|tr)>/gi, '\n')
  text = text.replace(/<(br|hr)[^>]*\/?>/gi, '\n')

  // Remove remaining HTML tags
  text = text.replace(/<[^>]+>/g, '')

  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ')
  text = text.replace(/&amp;/g, '&')
  text = text.replace(/&lt;/g, '<')
  text = text.replace(/&gt;/g, '>')
  text = text.replace(/&quot;/g, '"')
  text = text.replace(/&#39;/g, "'")

  // Clean up whitespace
  text = text.replace(/\n\s*\n/g, '\n\n')
  text = text.trim()

  return text
}

// Extract In-Reply-To header from email
function getInReplyTo(email: GraphEmail): string | null {
  if (!email.internetMessageHeaders) return null

  const header = email.internetMessageHeaders.find(
    (h) => h.name.toLowerCase() === 'in-reply-to'
  )
  return header?.value || null
}

// Extract References header from email
function getReferences(email: GraphEmail): string[] {
  if (!email.internetMessageHeaders) return []

  const header = email.internetMessageHeaders.find(
    (h) => h.name.toLowerCase() === 'references'
  )

  if (!header?.value) return []

  // References are space-separated message IDs
  return header.value.split(/\s+/).filter(Boolean)
}

// Look up client by email - check local DB, then Zoho CRM, then Zoho Books
export async function lookupClient(email: string): Promise<ClientLookupResult> {
  // Step 1: Check local database
  const localClient = await prisma.client.findUnique({
    where: { email: email.toLowerCase() },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      company: true,
      zohoCrmContactId: true,
      zohoBooksContactId: true,
    },
  })

  if (localClient) {
    return { client: localClient, source: 'local' }
  }

  // Step 2: Check Zoho CRM
  try {
    const crmContact = await zohoCrm.findContactByEmail(email)
    if (crmContact) {
      // Create local client from Zoho CRM contact
      const newClient = await prisma.client.create({
        data: {
          name: crmContact.Full_Name || `${crmContact.First_Name || ''} ${crmContact.Last_Name || ''}`.trim() || email,
          email: email.toLowerCase(),
          phone: crmContact.Phone || crmContact.Mobile || null,
          company: typeof crmContact.Account_Name === 'object' ? crmContact.Account_Name?.name : null,
          zohoCrmContactId: crmContact.id,
          zohoSyncStatus: 'SYNCED',
          zohoSyncedAt: new Date(),
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          company: true,
          zohoCrmContactId: true,
          zohoBooksContactId: true,
        },
      })

      return { client: newClient, source: 'zoho_crm' }
    }
  } catch (error) {
    console.error('Zoho CRM lookup failed:', error)
  }

  // Step 3: Check Zoho Books
  try {
    const booksContact = await zohoBooks.findContactByEmail(email)
    if (booksContact) {
      // Create local client from Zoho Books contact
      const newClient = await prisma.client.create({
        data: {
          name: booksContact.contact_name || email,
          email: email.toLowerCase(),
          phone: booksContact.phone || null,
          company: booksContact.company_name || null,
          zohoBooksContactId: booksContact.contact_id,
          zohoSyncStatus: 'SYNCED',
          zohoSyncedAt: new Date(),
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          company: true,
          zohoCrmContactId: true,
          zohoBooksContactId: true,
        },
      })

      return { client: newClient, source: 'zoho_books' }
    }
  } catch (error) {
    console.error('Zoho Books lookup failed:', error)
  }

  // Not found anywhere
  return { client: null, source: 'new' }
}

// Find existing email thread/ticket
export async function findEmailThread(
  email: GraphEmail,
  clientId: string
): Promise<string | null> {
  // Method 1: Check In-Reply-To header
  const inReplyTo = getInReplyTo(email)
  if (inReplyTo) {
    const parentMessage = await prisma.message.findFirst({
      where: { emailMessageId: inReplyTo },
      select: { ticketId: true },
    })
    if (parentMessage) {
      return parentMessage.ticketId
    }
  }

  // Method 2: Check References header
  const references = getReferences(email)
  if (references.length > 0) {
    for (const messageId of references) {
      const message = await prisma.message.findFirst({
        where: { emailMessageId: messageId },
        select: { ticketId: true },
      })
      if (message) {
        return message.ticketId
      }
    }
  }

  // Method 3: Subject line matching (strip RE:/FW: prefixes)
  const cleanSubject = email.subject
    .replace(/^(RE:|FW:|FWD:|AW:|SV:|VS:)\s*/gi, '')
    .trim()

  if (cleanSubject) {
    const ticket = await prisma.ticket.findFirst({
      where: {
        subject: cleanSubject,
        channel: TicketChannel.EMAIL,
        clientId,
        status: { in: [TicketStatus.OPEN, TicketStatus.PENDING] },
      },
      select: { id: true },
    })

    if (ticket) {
      return ticket.id
    }
  }

  return null
}

// Process incoming email and create/update ticket
export async function processIncomingEmail(
  accountId: string,
  graphEmail: GraphEmail,
  attachments?: GraphAttachment[]
): Promise<ProcessedEmail> {
  const senderEmail = graphEmail.from.emailAddress.address.toLowerCase()
  const senderName = graphEmail.from.emailAddress.name || senderEmail

  // 1. Look up or create client
  let { client, source } = await lookupClient(senderEmail)
  let isNewClient = false

  if (!client) {
    // Create new client
    client = await prisma.client.create({
      data: {
        name: senderName,
        email: senderEmail,
        zohoSyncStatus: 'PENDING',
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        zohoCrmContactId: true,
        zohoBooksContactId: true,
      },
    })
    isNewClient = true
  }

  // 2. Find existing thread or create new ticket
  let ticketId = await findEmailThread(graphEmail, client.id)
  let isNewTicket = false

  // Clean up subject
  const subject = graphEmail.subject || 'No Subject'
  const cleanSubject = subject.replace(/^(RE:|FW:|FWD:|AW:|SV:|VS:)\s*/gi, '').trim()

  if (!ticketId) {
    // Create new ticket
    const ticket = await prisma.ticket.create({
      data: {
        subject: cleanSubject || 'Email Inquiry',
        channel: TicketChannel.EMAIL,
        status: TicketStatus.OPEN,
        priority: 'MEDIUM',
        unread: true,
        clientId: client.id,
        emailAccountId: accountId,
      },
    })
    ticketId = ticket.id
    isNewTicket = true
  } else {
    // Update existing ticket
    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        unread: true,
        updatedAt: new Date(),
      },
    })
  }

  // 3. Process email content
  const htmlBody = graphEmail.body.contentType === 'html'
    ? graphEmail.body.content
    : `<p>${graphEmail.body.content}</p>`

  const strippedHtml = stripEmailContent(htmlBody)
  const plainText = htmlToPlainText(strippedHtml)

  // 4. Create message
  const message = await prisma.message.create({
    data: {
      ticketId,
      senderType: SenderType.CLIENT,
      senderId: client.id,
      content: plainText,
      read: false,
      timestamp: new Date(graphEmail.receivedDateTime),
      // Email-specific fields
      emailMessageId: graphEmail.internetMessageId,
      emailSubject: subject,
      emailFrom: senderEmail,
      emailTo: graphEmail.toRecipients.map((r) => r.emailAddress.address),
      emailCc: graphEmail.ccRecipients?.map((r) => r.emailAddress.address) || [],
      emailBcc: graphEmail.bccRecipients?.map((r) => r.emailAddress.address) || [],
      emailInReplyTo: getInReplyTo(graphEmail),
      emailReferences: getReferences(graphEmail),
      emailHtmlBody: htmlBody,
    },
  })

  // 5. Process attachments
  if (attachments && attachments.length > 0) {
    for (const att of attachments) {
      if (att.isInline) continue // Skip inline images

      // For now, store attachment metadata
      // In production, you'd upload contentBytes to S3/storage
      await prisma.attachment.create({
        data: {
          messageId: message.id,
          filename: att.name,
          mimeType: att.contentType,
          size: att.size,
          storageUrl: '', // TODO: Upload to storage and get URL
          storageKey: att.id, // Store Graph attachment ID for later retrieval
        },
      })
    }
  }

  return {
    ticketId,
    messageId: message.id,
    isNewTicket,
    clientId: client.id,
    isNewClient,
  }
}

// Get client's quotes and invoices for context
export async function getClientContext(clientId: string) {
  const [quotes, invoices, tickets] = await Promise.all([
    prisma.quote.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        number: true,
        status: true,
        totalAmount: true,
        createdAt: true,
      },
    }),
    prisma.invoice.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        number: true,
        status: true,
        totalAmount: true,
        dueDate: true,
        paidDate: true,
        createdAt: true,
      },
    }),
    prisma.ticket.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        subject: true,
        channel: true,
        status: true,
        createdAt: true,
      },
    }),
  ])

  // Calculate stats
  const pendingQuotes = quotes.filter((q) =>
    ['DRAFT', 'SENT', 'PENDING'].includes(q.status)
  )
  const pendingQuotesTotal = pendingQuotes.reduce((sum, q) => sum + q.totalAmount, 0)

  const unpaidInvoices = invoices.filter((i) =>
    ['PENDING', 'SENT', 'OVERDUE'].includes(i.status)
  )
  const unpaidTotal = unpaidInvoices.reduce((sum, i) => sum + i.totalAmount, 0)

  const overdueInvoices = invoices.filter((i) => {
    if (i.status === 'PAID') return false
    if (!i.dueDate) return false
    return new Date(i.dueDate) < new Date()
  })

  const openTickets = tickets.filter((t) =>
    ['OPEN', 'PENDING'].includes(t.status)
  )

  return {
    quotes,
    invoices,
    tickets,
    stats: {
      totalQuotes: quotes.length,
      pendingQuotes: pendingQuotes.length,
      pendingQuotesTotal,
      totalInvoices: invoices.length,
      unpaidInvoices: unpaidInvoices.length,
      unpaidTotal,
      overdueInvoices: overdueInvoices.length,
      openTickets: openTickets.length,
    },
  }
}
