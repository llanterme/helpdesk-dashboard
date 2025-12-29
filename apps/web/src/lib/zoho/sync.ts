/**
 * Zoho Sync Service
 *
 * Handles bidirectional sync between helpdesk and Zoho (Books + CRM)
 *
 * Phases:
 * 1. Infrastructure (SyncLog, status tracking)
 * 2. Client sync from Zoho Books
 * 3. Service catalog sync from Zoho Books
 * 4. Quote to Estimate sync
 * 5. Invoice and Payment sync
 */

import { prisma } from '@/lib/prisma'
import { zohoBooks, ZohoItem, ZohoContact, ZohoEstimate, ZohoInvoice } from './books'
import { zohoCrm, ZohoCrmContact } from './crm'
import { isZohoConfigured } from './config'
import { SyncDirection } from '@prisma/client'

interface SyncResult {
  created: number
  updated: number
  skipped: number
  errors: string[]
}

interface EntitySyncResult {
  success: boolean
  zohoId?: string
  error?: string
}

// ============ SYNC LOGGING ============

/**
 * Log a sync operation for audit trail
 */
async function logSync(
  entityType: string,
  entityId: string,
  direction: SyncDirection,
  status: 'success' | 'failed' | 'skipped',
  zohoId?: string,
  errorMessage?: string,
  requestBody?: object,
  responseBody?: object
): Promise<void> {
  try {
    await prisma.syncLog.create({
      data: {
        entityType,
        entityId,
        direction,
        status,
        zohoId,
        errorMessage,
        requestBody: requestBody ? JSON.parse(JSON.stringify(requestBody)) : undefined,
        responseBody: responseBody ? JSON.parse(JSON.stringify(responseBody)) : undefined,
      },
    })
  } catch (error) {
    console.error('Failed to log sync:', error)
  }
}

// ============ PHASE 2: CLIENTS SYNC FROM ZOHO ============

/**
 * Pull all customers from Zoho Books and sync to local database
 */
export async function syncClientsFromZoho(): Promise<SyncResult> {
  if (!isZohoConfigured()) {
    return { created: 0, updated: 0, skipped: 0, errors: ['Zoho not configured'] }
  }

  const result: SyncResult = { created: 0, updated: 0, skipped: 0, errors: [] }

  try {
    let page = 1
    let hasMore = true

    while (hasMore) {
      const { contacts, hasMore: more } = await zohoBooks.getContacts(page, 200, 'customer')
      hasMore = more
      page++

      for (const contact of contacts) {
        try {
          // Skip contacts without email
          if (!contact.email) {
            result.skipped++
            continue
          }

          // Check if client exists by Zoho ID or email
          const existing = await prisma.client.findFirst({
            where: {
              OR: [
                { zohoBooksContactId: contact.contact_id },
                { email: contact.email },
              ],
            },
          })

          const clientData = {
            name: contact.contact_name,
            email: contact.email,
            phone: contact.phone || contact.mobile || null,
            company: contact.company_name || null,
            zohoBooksContactId: contact.contact_id,
            zohoSyncedAt: new Date(),
            zohoSyncStatus: 'SYNCED' as const,
            zohoSyncError: null,
          }

          if (existing) {
            await prisma.client.update({
              where: { id: existing.id },
              data: clientData,
            })
            await logSync('client', existing.id, 'FROM_ZOHO', 'success', contact.contact_id)
            result.updated++
          } else {
            const newClient = await prisma.client.create({
              data: clientData,
            })
            await logSync('client', newClient.id, 'FROM_ZOHO', 'success', contact.contact_id)
            result.created++
          }
        } catch (error) {
          const errorMsg = `Failed to sync contact ${contact.contact_name}: ${error}`
          result.errors.push(errorMsg)
          await logSync('client', contact.contact_id, 'FROM_ZOHO', 'failed', undefined, errorMsg)
        }
      }
    }
  } catch (error) {
    result.errors.push(`Failed to fetch Zoho contacts: ${error}`)
  }

  return result
}

/**
 * Sync a single client to both Zoho Books and Zoho CRM
 */
export async function syncClientToZoho(clientId: string): Promise<EntitySyncResult & {
  booksContactId?: string
  crmContactId?: string
}> {
  if (!isZohoConfigured()) {
    return { success: false, error: 'Zoho not configured' }
  }

  const client = await prisma.client.findUnique({ where: { id: clientId } })
  if (!client) {
    return { success: false, error: 'Client not found' }
  }

  const result: {
    success: boolean
    booksContactId?: string
    crmContactId?: string
    error?: string
  } = { success: false }

  // Sync to Zoho Books
  try {
    if (client.zohoBooksContactId) {
      // Update existing contact
      await zohoBooks.updateContact(client.zohoBooksContactId, {
        contact_name: client.name,
        email: client.email,
        phone: client.phone || undefined,
        company_name: client.company || undefined,
      })
      result.booksContactId = client.zohoBooksContactId
    } else {
      // Check if contact exists by email
      const existing = await zohoBooks.findContactByEmail(client.email)
      if (existing) {
        result.booksContactId = existing.contact_id
      } else {
        // Create new contact
        const newContact = await zohoBooks.createContact({
          contact_name: client.name,
          email: client.email,
          phone: client.phone || undefined,
          company_name: client.company || undefined,
          contact_type: 'customer',
        })
        result.booksContactId = newContact.contact_id
      }
    }
  } catch (error) {
    result.error = `Zoho Books sync failed: ${error}`
  }

  // Sync to Zoho CRM
  try {
    const nameParts = client.name.split(' ')
    const firstName = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : undefined
    const lastName = nameParts.slice(-1)[0] || client.name

    if (client.zohoCrmContactId) {
      // Update existing contact
      await zohoCrm.updateContact(client.zohoCrmContactId, {
        First_Name: firstName,
        Last_Name: lastName,
        Email: client.email,
        Phone: client.phone || undefined,
        Account_Name: client.company || undefined,
      })
      result.crmContactId = client.zohoCrmContactId
    } else {
      // Check if contact exists by email
      const existing = await zohoCrm.findContactByEmail(client.email)
      if (existing) {
        result.crmContactId = existing.id
      } else {
        // Create new contact
        const newContact = await zohoCrm.createContact({
          First_Name: firstName,
          Last_Name: lastName,
          Email: client.email,
          Phone: client.phone || undefined,
          Account_Name: client.company || undefined,
        })
        result.crmContactId = newContact.id
      }
    }
  } catch (error) {
    result.error = (result.error || '') + ` CRM sync failed: ${error}`
  }

  // Update local record with Zoho IDs and status
  if (result.booksContactId || result.crmContactId) {
    await prisma.client.update({
      where: { id: clientId },
      data: {
        zohoBooksContactId: result.booksContactId || client.zohoBooksContactId,
        zohoCrmContactId: result.crmContactId || client.zohoCrmContactId,
        zohoSyncedAt: new Date(),
        zohoSyncStatus: result.error ? 'FAILED' : 'SYNCED',
        zohoSyncError: result.error || null,
      },
    })
    await logSync('client', clientId, 'TO_ZOHO', result.error ? 'failed' : 'success',
      result.booksContactId, result.error)
    result.success = !result.error
  }

  return result
}

/**
 * Sync all unsynced clients to Zoho
 */
export async function syncAllClientsToZoho(): Promise<SyncResult> {
  if (!isZohoConfigured()) {
    return { created: 0, updated: 0, skipped: 0, errors: ['Zoho not configured'] }
  }

  const result: SyncResult = { created: 0, updated: 0, skipped: 0, errors: [] }

  const clients = await prisma.client.findMany({
    where: {
      OR: [
        { zohoBooksContactId: null },
        { zohoCrmContactId: null },
        { zohoSyncStatus: 'PENDING' },
        { zohoSyncStatus: 'FAILED' },
      ],
    },
  })

  for (const client of clients) {
    const syncResult = await syncClientToZoho(client.id)
    if (syncResult.error) {
      result.errors.push(`Client ${client.email}: ${syncResult.error}`)
    } else if (syncResult.booksContactId || syncResult.crmContactId) {
      if (client.zohoBooksContactId || client.zohoCrmContactId) {
        result.updated++
      } else {
        result.created++
      }
    }
  }

  return result
}

// ============ PHASE 3: SERVICES SYNC FROM ZOHO ============

/**
 * Sync services from Zoho Books Items to local database
 */
export async function syncServicesFromZoho(): Promise<SyncResult> {
  if (!isZohoConfigured()) {
    return { created: 0, updated: 0, skipped: 0, errors: ['Zoho not configured'] }
  }

  const result: SyncResult = { created: 0, updated: 0, skipped: 0, errors: [] }

  try {
    // Fetch all items from Zoho Books
    const zohoItems = await zohoBooks.getAllItems()

    for (const item of zohoItems) {
      try {
        // Skip inactive items
        if (item.status !== 'active') {
          result.skipped++
          continue
        }

        // Check if service exists by Zoho ID or SKU
        const existing = await prisma.service.findFirst({
          where: {
            OR: [
              { zohoBooksItemId: item.item_id },
              { sku: item.sku || item.item_id },
            ],
          },
        })

        // Derive category from item name prefix
        const category = deriveCategory(item.name, item.group_name)

        const serviceData = {
          name: item.name,
          description: item.description || null,
          rate: item.rate,
          unit: item.unit || 'Each',
          sku: item.sku || item.item_id,
          category,
          active: item.status === 'active',
          zohoBooksItemId: item.item_id,
          zohoSyncedAt: new Date(),
          zohoSyncStatus: 'SYNCED' as const,
        }

        if (existing) {
          await prisma.service.update({
            where: { id: existing.id },
            data: serviceData,
          })
          await logSync('service', existing.id, 'FROM_ZOHO', 'success', item.item_id)
          result.updated++
        } else {
          const newService = await prisma.service.create({
            data: serviceData,
          })
          await logSync('service', newService.id, 'FROM_ZOHO', 'success', item.item_id)
          result.created++
        }
      } catch (error) {
        const errorMsg = `Failed to sync item ${item.name}: ${error}`
        result.errors.push(errorMsg)
        await logSync('service', item.item_id, 'FROM_ZOHO', 'failed', undefined, errorMsg)
      }
    }
  } catch (error) {
    result.errors.push(`Failed to fetch Zoho items: ${error}`)
  }

  return result
}

/**
 * Derive service category from item name or group
 */
function deriveCategory(name: string, groupName?: string): string {
  if (groupName) return groupName

  const nameLower = name.toLowerCase()

  if (nameLower.includes('dha:') || nameLower.includes('dha ')) return 'DHA Services'
  if (nameLower.includes('dirco')) return 'DIRCO Services'
  if (nameLower.includes('saps')) return 'SAPS Services'
  if (nameLower.includes('high court') || nameLower.includes('notary')) return 'High Court Services'
  if (nameLower.includes('courier') || nameLower.includes('international')) return 'Courier Services'
  if (nameLower.includes('embassy')) return 'Embassy Services'
  if (nameLower.includes('saqa')) return 'SAQA Services'
  if (nameLower.includes('hpcsa')) return 'HPCSA Services'
  if (nameLower.includes('translation') || nameLower.includes('apostille')) return 'Translation & Apostille'

  return 'Other Services'
}

// ============ PHASE 4: QUOTES SYNC TO ZOHO ESTIMATES ============

/**
 * Sync a quote to Zoho Books as an Estimate
 */
export async function syncQuoteToZoho(quoteId: string): Promise<EntitySyncResult & {
  estimateId?: string
  estimateNumber?: string
}> {
  if (!isZohoConfigured()) {
    return { success: false, error: 'Zoho not configured' }
  }

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: {
      client: true,
      items: { include: { service: true } },
    },
  })

  if (!quote) {
    return { success: false, error: 'Quote not found' }
  }

  // Ensure client is synced to Zoho Books first
  if (!quote.client.zohoBooksContactId) {
    const clientSync = await syncClientToZoho(quote.clientId)
    if (!clientSync.booksContactId) {
      const error = 'Failed to sync client to Zoho Books first'
      await prisma.quote.update({
        where: { id: quoteId },
        data: { zohoSyncStatus: 'FAILED', zohoSyncError: error },
      })
      return { success: false, error }
    }
  }

  // Refresh client data
  const client = await prisma.client.findUnique({ where: { id: quote.clientId } })
  if (!client?.zohoBooksContactId) {
    return { success: false, error: 'Client does not have Zoho Books contact ID' }
  }

  try {
    const lineItems = quote.items.map((item) => ({
      item_id: item.service.zohoBooksItemId || undefined,
      name: item.customDescription || item.service.name,
      description: item.service.description || undefined,
      rate: item.rate,
      quantity: item.quantity,
    }))

    let estimate: ZohoEstimate

    if (quote.zohoBooksEstimateId) {
      // Update existing estimate
      estimate = await zohoBooks.updateEstimate(quote.zohoBooksEstimateId, {
        line_items: lineItems,
        notes: quote.notes || undefined,
        terms: quote.terms || undefined,
        expiry_date: quote.validUntil?.toISOString().split('T')[0],
      })
    } else {
      // Create new estimate
      estimate = await zohoBooks.createEstimate({
        customer_id: client.zohoBooksContactId,
        line_items: lineItems,
        notes: quote.notes || undefined,
        terms: quote.terms || undefined,
        expiry_date: quote.validUntil?.toISOString().split('T')[0],
        discount: quote.discountAmount,
        discount_type: 'entity_level',
      })
    }

    // Update local quote with Zoho ID
    await prisma.quote.update({
      where: { id: quoteId },
      data: {
        zohoBooksEstimateId: estimate.estimate_id,
        zohoSyncedAt: new Date(),
        zohoSyncStatus: 'SYNCED',
        zohoSyncError: null,
      },
    })

    await logSync('quote', quoteId, 'TO_ZOHO', 'success', estimate.estimate_id)

    return {
      success: true,
      zohoId: estimate.estimate_id,
      estimateId: estimate.estimate_id,
      estimateNumber: estimate.estimate_number,
    }
  } catch (error) {
    const errorMsg = `Failed to sync quote to Zoho: ${error}`
    await prisma.quote.update({
      where: { id: quoteId },
      data: { zohoSyncStatus: 'FAILED', zohoSyncError: errorMsg },
    })
    await logSync('quote', quoteId, 'TO_ZOHO', 'failed', undefined, errorMsg)
    return { success: false, error: errorMsg }
  }
}

/**
 * Update Zoho estimate status based on local quote status
 */
export async function syncQuoteStatusToZoho(quoteId: string): Promise<EntitySyncResult> {
  if (!isZohoConfigured()) {
    return { success: false, error: 'Zoho not configured' }
  }

  const quote = await prisma.quote.findUnique({ where: { id: quoteId } })
  if (!quote?.zohoBooksEstimateId) {
    return { success: false, error: 'Quote not synced to Zoho' }
  }

  try {
    switch (quote.status) {
      case 'SENT':
        await zohoBooks.markEstimateAsSent(quote.zohoBooksEstimateId)
        break
      case 'ACCEPTED':
        await zohoBooks.markEstimateAsAccepted(quote.zohoBooksEstimateId)
        break
      case 'REJECTED':
        await zohoBooks.markEstimateAsDeclined(quote.zohoBooksEstimateId)
        break
    }

    await prisma.quote.update({
      where: { id: quoteId },
      data: { zohoSyncedAt: new Date(), zohoSyncStatus: 'SYNCED', zohoSyncError: null },
    })

    await logSync('quote', quoteId, 'TO_ZOHO', 'success', quote.zohoBooksEstimateId)
    return { success: true, zohoId: quote.zohoBooksEstimateId }
  } catch (error) {
    const errorMsg = `Failed to update Zoho estimate status: ${error}`
    await logSync('quote', quoteId, 'TO_ZOHO', 'failed', quote.zohoBooksEstimateId, errorMsg)
    return { success: false, error: errorMsg }
  }
}

/**
 * Auto-sync quote when status changes
 */
export async function handleQuoteStatusChange(quoteId: string, newStatus: string): Promise<EntitySyncResult> {
  // First ensure quote is synced to Zoho
  const quote = await prisma.quote.findUnique({ where: { id: quoteId } })

  if (!quote?.zohoBooksEstimateId) {
    // Sync the quote first
    const syncResult = await syncQuoteToZoho(quoteId)
    if (!syncResult.success) {
      return syncResult
    }
  }

  // Then sync the status
  return syncQuoteStatusToZoho(quoteId)
}

// ============ PHASE 5: INVOICES SYNC ============

/**
 * Sync an invoice to Zoho Books
 */
export async function syncInvoiceToZoho(invoiceId: string): Promise<EntitySyncResult & {
  zohoInvoiceId?: string
  invoiceNumber?: string
}> {
  if (!isZohoConfigured()) {
    return { success: false, error: 'Zoho not configured' }
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      client: true,
      items: { include: { service: true } },
      quote: true,
    },
  })

  if (!invoice) {
    return { success: false, error: 'Invoice not found' }
  }

  // Ensure client is synced first
  if (!invoice.client.zohoBooksContactId) {
    const clientSync = await syncClientToZoho(invoice.clientId)
    if (!clientSync.booksContactId) {
      const error = 'Failed to sync client to Zoho Books first'
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { zohoSyncStatus: 'FAILED', zohoSyncError: error },
      })
      return { success: false, error }
    }
  }

  // Refresh client data
  const client = await prisma.client.findUnique({ where: { id: invoice.clientId } })
  if (!client?.zohoBooksContactId) {
    return { success: false, error: 'Client does not have Zoho Books contact ID' }
  }

  try {
    let zohoInvoice: ZohoInvoice

    // If quote has a Zoho estimate, convert it
    if (invoice.quote?.zohoBooksEstimateId && !invoice.zohoBooksInvoiceId) {
      zohoInvoice = await zohoBooks.convertEstimateToInvoice(
        invoice.quote.zohoBooksEstimateId
      )
    } else if (invoice.zohoBooksInvoiceId) {
      // Update existing invoice
      const lineItems = invoice.items.map((item) => ({
        item_id: item.service.zohoBooksItemId || undefined,
        name: item.service.name,
        rate: item.rate,
        quantity: item.quantity,
      }))

      zohoInvoice = await zohoBooks.updateInvoice(invoice.zohoBooksInvoiceId, {
        line_items: lineItems,
        due_date: invoice.dueDate?.toISOString().split('T')[0],
      })
    } else {
      // Create new invoice
      const lineItems = invoice.items.map((item) => ({
        item_id: item.service.zohoBooksItemId || undefined,
        name: item.service.name,
        description: item.service.description || undefined,
        rate: item.rate,
        quantity: item.quantity,
      }))

      zohoInvoice = await zohoBooks.createInvoice({
        customer_id: client.zohoBooksContactId,
        line_items: lineItems,
        due_date: invoice.dueDate?.toISOString().split('T')[0],
      })
    }

    // Update local invoice with Zoho ID
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        zohoBooksInvoiceId: zohoInvoice.invoice_id,
        number: invoice.number || zohoInvoice.invoice_number,
        zohoSyncedAt: new Date(),
        zohoSyncStatus: 'SYNCED',
        zohoSyncError: null,
      },
    })

    await logSync('invoice', invoiceId, 'TO_ZOHO', 'success', zohoInvoice.invoice_id)

    return {
      success: true,
      zohoId: zohoInvoice.invoice_id,
      zohoInvoiceId: zohoInvoice.invoice_id,
      invoiceNumber: zohoInvoice.invoice_number,
    }
  } catch (error) {
    const errorMsg = `Failed to sync invoice to Zoho: ${error}`
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { zohoSyncStatus: 'FAILED', zohoSyncError: errorMsg },
    })
    await logSync('invoice', invoiceId, 'TO_ZOHO', 'failed', undefined, errorMsg)
    return { success: false, error: errorMsg }
  }
}

/**
 * Update Zoho invoice status based on local invoice status
 */
export async function syncInvoiceStatusToZoho(invoiceId: string): Promise<EntitySyncResult> {
  if (!isZohoConfigured()) {
    return { success: false, error: 'Zoho not configured' }
  }

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } })
  if (!invoice?.zohoBooksInvoiceId) {
    return { success: false, error: 'Invoice not synced to Zoho' }
  }

  try {
    switch (invoice.status) {
      case 'SENT':
        await zohoBooks.markInvoiceAsSent(invoice.zohoBooksInvoiceId)
        break
      case 'PAID':
        await zohoBooks.markInvoiceAsPaid(
          invoice.zohoBooksInvoiceId,
          invoice.totalAmount,
          invoice.paidDate?.toISOString().split('T')[0]
        )
        break
    }

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { zohoSyncedAt: new Date(), zohoSyncStatus: 'SYNCED', zohoSyncError: null },
    })

    await logSync('invoice', invoiceId, 'TO_ZOHO', 'success', invoice.zohoBooksInvoiceId)
    return { success: true, zohoId: invoice.zohoBooksInvoiceId }
  } catch (error) {
    const errorMsg = `Failed to update Zoho invoice status: ${error}`
    await logSync('invoice', invoiceId, 'TO_ZOHO', 'failed', invoice.zohoBooksInvoiceId, errorMsg)
    return { success: false, error: errorMsg }
  }
}

/**
 * Record a payment in Zoho Books
 */
export async function syncPaymentToZoho(
  invoiceId: string,
  amount: number,
  paymentDate: Date,
  paymentMode: string = 'bank_transfer'
): Promise<EntitySyncResult & { paymentId?: string }> {
  if (!isZohoConfigured()) {
    return { success: false, error: 'Zoho not configured' }
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { client: true },
  })

  if (!invoice?.zohoBooksInvoiceId) {
    return { success: false, error: 'Invoice not synced to Zoho' }
  }

  if (!invoice.client.zohoBooksContactId) {
    return { success: false, error: 'Client not synced to Zoho' }
  }

  try {
    const response = await zohoBooks.recordPayment({
      customer_id: invoice.client.zohoBooksContactId,
      payment_mode: paymentMode,
      amount,
      date: paymentDate.toISOString().split('T')[0],
      invoices: [{
        invoice_id: invoice.zohoBooksInvoiceId,
        amount_applied: amount,
      }],
    })

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'PAID',
        paidDate: paymentDate,
        zohoPaymentId: response.payment_id,
        zohoSyncedAt: new Date(),
        zohoSyncStatus: 'SYNCED',
      },
    })

    await logSync('invoice', invoiceId, 'TO_ZOHO', 'success', response.payment_id)
    return { success: true, zohoId: response.payment_id, paymentId: response.payment_id }
  } catch (error) {
    const errorMsg = `Failed to record payment in Zoho: ${error}`
    await logSync('invoice', invoiceId, 'TO_ZOHO', 'failed', undefined, errorMsg)
    return { success: false, error: errorMsg }
  }
}

// ============ FULL SYNC ============

/**
 * Run a full sync from Zoho to local database
 */
export async function runFullSyncFromZoho(): Promise<{
  clients: SyncResult
  services: SyncResult
  timestamp: Date
}> {
  const timestamp = new Date()

  // Sync clients first (they're needed for quotes/invoices)
  const clients = await syncClientsFromZoho()

  // Then sync services
  const services = await syncServicesFromZoho()

  return {
    clients,
    services,
    timestamp,
  }
}

/**
 * Sync all pending entities to Zoho
 */
export async function runFullSyncToZoho(): Promise<{
  clients: SyncResult
  quotes: SyncResult
  invoices: SyncResult
  timestamp: Date
}> {
  const timestamp = new Date()

  // Sync clients first
  const clients = await syncAllClientsToZoho()

  // Sync pending quotes
  const quotesResult: SyncResult = { created: 0, updated: 0, skipped: 0, errors: [] }
  const pendingQuotes = await prisma.quote.findMany({
    where: {
      OR: [
        { zohoSyncStatus: 'PENDING' },
        { zohoSyncStatus: 'FAILED' },
      ],
      status: { not: 'DRAFT' }, // Only sync non-draft quotes
    },
  })

  for (const quote of pendingQuotes) {
    const result = await syncQuoteToZoho(quote.id)
    if (result.success) {
      if (quote.zohoBooksEstimateId) {
        quotesResult.updated++
      } else {
        quotesResult.created++
      }
    } else {
      quotesResult.errors.push(`Quote ${quote.number}: ${result.error}`)
    }
  }

  // Sync pending invoices
  const invoicesResult: SyncResult = { created: 0, updated: 0, skipped: 0, errors: [] }
  const pendingInvoices = await prisma.invoice.findMany({
    where: {
      OR: [
        { zohoSyncStatus: 'PENDING' },
        { zohoSyncStatus: 'FAILED' },
      ],
    },
  })

  for (const invoice of pendingInvoices) {
    const result = await syncInvoiceToZoho(invoice.id)
    if (result.success) {
      if (invoice.zohoBooksInvoiceId) {
        invoicesResult.updated++
      } else {
        invoicesResult.created++
      }
    } else {
      invoicesResult.errors.push(`Invoice ${invoice.number}: ${result.error}`)
    }
  }

  return {
    clients,
    quotes: quotesResult,
    invoices: invoicesResult,
    timestamp,
  }
}

// ============ SYNC STATUS HELPERS ============

/**
 * Get sync status summary
 */
export async function getSyncStatus(): Promise<{
  clients: { total: number; synced: number; pending: number; failed: number }
  services: { total: number; synced: number; pending: number; failed: number }
  quotes: { total: number; synced: number; pending: number; failed: number }
  invoices: { total: number; synced: number; pending: number; failed: number }
  lastSync?: Date
}> {
  const [
    clientStats,
    serviceStats,
    quoteStats,
    invoiceStats,
    lastSyncLog,
  ] = await Promise.all([
    prisma.client.groupBy({
      by: ['zohoSyncStatus'],
      _count: true,
    }),
    prisma.service.groupBy({
      by: ['zohoSyncStatus'],
      _count: true,
    }),
    prisma.quote.groupBy({
      by: ['zohoSyncStatus'],
      _count: true,
    }),
    prisma.invoice.groupBy({
      by: ['zohoSyncStatus'],
      _count: true,
    }),
    prisma.syncLog.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    }),
  ])

  const aggregateStats = (stats: { zohoSyncStatus: string; _count: number }[]) => {
    const result = { total: 0, synced: 0, pending: 0, failed: 0 }
    for (const stat of stats) {
      result.total += stat._count
      switch (stat.zohoSyncStatus) {
        case 'SYNCED':
          result.synced += stat._count
          break
        case 'PENDING':
          result.pending += stat._count
          break
        case 'FAILED':
        case 'CONFLICT':
          result.failed += stat._count
          break
      }
    }
    return result
  }

  return {
    clients: aggregateStats(clientStats),
    services: aggregateStats(serviceStats),
    quotes: aggregateStats(quoteStats),
    invoices: aggregateStats(invoiceStats),
    lastSync: lastSyncLog?.createdAt,
  }
}

/**
 * Get recent sync logs
 */
export async function getRecentSyncLogs(limit: number = 50): Promise<{
  id: string
  entityType: string
  entityId: string
  direction: string
  status: string
  zohoId?: string | null
  errorMessage?: string | null
  createdAt: Date
}[]> {
  return prisma.syncLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      entityType: true,
      entityId: true,
      direction: true,
      status: true,
      zohoId: true,
      errorMessage: true,
      createdAt: true,
    },
  })
}
