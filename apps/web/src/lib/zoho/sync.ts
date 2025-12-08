/**
 * Zoho Sync Service
 *
 * Handles bidirectional sync between helpdesk and Zoho
 */

import { prisma } from '@/lib/prisma'
import { zohoBooks, ZohoItem, ZohoContact, ZohoEstimate, ZohoInvoice } from './books'
import { zohoCrm, ZohoCrmContact } from './crm'
import { isZohoConfigured } from './config'

interface SyncResult {
  created: number
  updated: number
  errors: string[]
}

// ============ SERVICES SYNC (from Zoho Books Items) ============

/**
 * Sync services from Zoho Books Items to local database
 */
export async function syncServicesFromZoho(): Promise<SyncResult> {
  if (!isZohoConfigured()) {
    return { created: 0, updated: 0, errors: ['Zoho not configured'] }
  }

  const result: SyncResult = { created: 0, updated: 0, errors: [] }

  try {
    // Fetch all items from Zoho Books
    const zohoItems = await zohoBooks.getAllItems()

    for (const item of zohoItems) {
      try {
        // Check if service exists by Zoho ID
        const existing = await prisma.service.findFirst({
          where: {
            OR: [
              { zohoBooksItemId: item.item_id },
              { sku: item.sku || item.item_id },
            ],
          },
        })

        const serviceData = {
          name: item.name,
          description: item.description || null,
          rate: item.rate,
          unit: item.unit || 'per item',
          sku: item.sku || item.item_id,
          category: item.group_name || 'General',
          active: item.status === 'active',
          zohoBooksItemId: item.item_id,
          zohoSyncedAt: new Date(),
        }

        if (existing) {
          await prisma.service.update({
            where: { id: existing.id },
            data: serviceData,
          })
          result.updated++
        } else {
          await prisma.service.create({
            data: serviceData,
          })
          result.created++
        }
      } catch (error) {
        result.errors.push(`Failed to sync item ${item.name}: ${error}`)
      }
    }
  } catch (error) {
    result.errors.push(`Failed to fetch Zoho items: ${error}`)
  }

  return result
}

// ============ CLIENTS SYNC ============

/**
 * Sync a single client to both Zoho Books and Zoho CRM
 */
export async function syncClientToZoho(clientId: string): Promise<{
  booksContactId?: string
  crmContactId?: string
  error?: string
}> {
  if (!isZohoConfigured()) {
    return { error: 'Zoho not configured' }
  }

  const client = await prisma.client.findUnique({ where: { id: clientId } })
  if (!client) {
    return { error: 'Client not found' }
  }

  const result: { booksContactId?: string; crmContactId?: string; error?: string } = {}

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
    const firstName = nameParts.slice(0, -1).join(' ') || undefined
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

  // Update local record with Zoho IDs
  if (result.booksContactId || result.crmContactId) {
    await prisma.client.update({
      where: { id: clientId },
      data: {
        zohoBooksContactId: result.booksContactId || client.zohoBooksContactId,
        zohoCrmContactId: result.crmContactId || client.zohoCrmContactId,
        zohoSyncedAt: new Date(),
      },
    })
  }

  return result
}

/**
 * Sync all unsynced clients to Zoho
 */
export async function syncAllClientsToZoho(): Promise<SyncResult> {
  if (!isZohoConfigured()) {
    return { created: 0, updated: 0, errors: ['Zoho not configured'] }
  }

  const result: SyncResult = { created: 0, updated: 0, errors: [] }

  const clients = await prisma.client.findMany({
    where: {
      OR: [
        { zohoBooksContactId: null },
        { zohoCrmContactId: null },
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

// ============ QUOTES SYNC (to Zoho Books Estimates) ============

/**
 * Sync a quote to Zoho Books as an Estimate
 */
export async function syncQuoteToZoho(quoteId: string): Promise<{
  estimateId?: string
  estimateNumber?: string
  error?: string
}> {
  if (!isZohoConfigured()) {
    return { error: 'Zoho not configured' }
  }

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: {
      client: true,
      items: { include: { service: true } },
    },
  })

  if (!quote) {
    return { error: 'Quote not found' }
  }

  // Ensure client is synced to Zoho Books first
  if (!quote.client.zohoBooksContactId) {
    const clientSync = await syncClientToZoho(quote.clientId)
    if (!clientSync.booksContactId) {
      return { error: 'Failed to sync client to Zoho Books first' }
    }
  }

  // Refresh client data
  const client = await prisma.client.findUnique({ where: { id: quote.clientId } })
  if (!client?.zohoBooksContactId) {
    return { error: 'Client does not have Zoho Books contact ID' }
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
      },
    })

    return {
      estimateId: estimate.estimate_id,
      estimateNumber: estimate.estimate_number,
    }
  } catch (error) {
    return { error: `Failed to sync quote to Zoho: ${error}` }
  }
}

/**
 * Update Zoho estimate status based on local quote status
 */
export async function syncQuoteStatusToZoho(quoteId: string): Promise<{ error?: string }> {
  if (!isZohoConfigured()) {
    return { error: 'Zoho not configured' }
  }

  const quote = await prisma.quote.findUnique({ where: { id: quoteId } })
  if (!quote?.zohoBooksEstimateId) {
    return { error: 'Quote not synced to Zoho' }
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
    return {}
  } catch (error) {
    return { error: `Failed to update Zoho estimate status: ${error}` }
  }
}

// ============ INVOICES SYNC ============

/**
 * Sync an invoice to Zoho Books
 */
export async function syncInvoiceToZoho(invoiceId: string): Promise<{
  zohoInvoiceId?: string
  invoiceNumber?: string
  error?: string
}> {
  if (!isZohoConfigured()) {
    return { error: 'Zoho not configured' }
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
    return { error: 'Invoice not found' }
  }

  // Ensure client is synced first
  if (!invoice.client.zohoBooksContactId) {
    const clientSync = await syncClientToZoho(invoice.clientId)
    if (!clientSync.booksContactId) {
      return { error: 'Failed to sync client to Zoho Books first' }
    }
  }

  // Refresh client data
  const client = await prisma.client.findUnique({ where: { id: invoice.clientId } })
  if (!client?.zohoBooksContactId) {
    return { error: 'Client does not have Zoho Books contact ID' }
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
        number: zohoInvoice.invoice_number,
        zohoSyncedAt: new Date(),
      },
    })

    return {
      zohoInvoiceId: zohoInvoice.invoice_id,
      invoiceNumber: zohoInvoice.invoice_number,
    }
  } catch (error) {
    return { error: `Failed to sync invoice to Zoho: ${error}` }
  }
}

/**
 * Update Zoho invoice status based on local invoice status
 */
export async function syncInvoiceStatusToZoho(invoiceId: string): Promise<{ error?: string }> {
  if (!isZohoConfigured()) {
    return { error: 'Zoho not configured' }
  }

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } })
  if (!invoice?.zohoBooksInvoiceId) {
    return { error: 'Invoice not synced to Zoho' }
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
    return {}
  } catch (error) {
    return { error: `Failed to update Zoho invoice status: ${error}` }
  }
}

// ============ FULL SYNC ============

/**
 * Run a full sync from Zoho to local database
 */
export async function runFullSyncFromZoho(): Promise<{
  services: SyncResult
  timestamp: Date
}> {
  const timestamp = new Date()

  const services = await syncServicesFromZoho()

  return {
    services,
    timestamp,
  }
}
