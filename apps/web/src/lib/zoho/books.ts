/**
 * Zoho Books API Client
 *
 * Handles Items, Estimates, Invoices, and Contacts
 */

import { getZohoConfig, getZohoBaseUrls } from './config'
import { zohoFetch } from './auth'

// Types for Zoho Books entities
export interface ZohoItem {
  item_id: string
  name: string
  description?: string
  rate: number
  unit?: string
  sku?: string
  status: 'active' | 'inactive'
  product_type?: string
  group_name?: string // Category
}

export interface ZohoContact {
  contact_id: string
  contact_name: string
  company_name?: string
  email?: string
  phone?: string
  mobile?: string
  contact_type: 'customer' | 'vendor'
  status: 'active' | 'inactive'
}

export interface ZohoEstimate {
  estimate_id: string
  estimate_number: string
  customer_id: string
  customer_name: string
  status: 'draft' | 'sent' | 'invoiced' | 'accepted' | 'declined' | 'expired'
  date: string
  expiry_date?: string
  sub_total: number
  tax_total: number
  discount: number
  total: number
  notes?: string
  terms?: string
  line_items: ZohoLineItem[]
}

export interface ZohoInvoice {
  invoice_id: string
  invoice_number: string
  customer_id: string
  customer_name: string
  status: 'draft' | 'sent' | 'overdue' | 'paid' | 'void' | 'partially_paid'
  date: string
  due_date?: string
  sub_total: number
  tax_total: number
  discount: number
  total: number
  balance: number
  payment_made: number
  notes?: string
  terms?: string
  line_items: ZohoLineItem[]
}

export interface ZohoLineItem {
  line_item_id?: string
  item_id: string
  name: string
  description?: string
  rate: number
  quantity: number
  discount?: number
  tax_id?: string
  item_total: number
}

class ZohoBooksClient {
  private baseUrl: string
  private organizationId: string

  constructor() {
    const config = getZohoConfig()
    const urls = getZohoBaseUrls(config.region)
    this.baseUrl = urls.books
    this.organizationId = config.organizationId
  }

  private getUrl(endpoint: string): string {
    const separator = endpoint.includes('?') ? '&' : '?'
    return `${this.baseUrl}${endpoint}${separator}organization_id=${this.organizationId}`
  }

  // ============ ITEMS (Services) ============

  async getItems(page: number = 1, perPage: number = 200): Promise<{ items: ZohoItem[]; hasMore: boolean }> {
    const response = await zohoFetch(
      this.getUrl(`/items?page=${page}&per_page=${perPage}`)
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to fetch Zoho items: ${error}`)
    }

    const data = await response.json()
    return {
      items: data.items || [],
      hasMore: data.page_context?.has_more_page || false,
    }
  }

  async getItem(itemId: string): Promise<ZohoItem> {
    const response = await zohoFetch(this.getUrl(`/items/${itemId}`))

    if (!response.ok) {
      throw new Error(`Failed to fetch Zoho item ${itemId}`)
    }

    const data = await response.json()
    return data.item
  }

  async getAllItems(): Promise<ZohoItem[]> {
    const allItems: ZohoItem[] = []
    let page = 1
    let hasMore = true

    while (hasMore) {
      const result = await this.getItems(page, 200)
      allItems.push(...result.items)
      hasMore = result.hasMore
      page++
    }

    return allItems
  }

  // ============ CONTACTS ============

  async getContacts(
    page: number = 1,
    perPage: number = 200,
    contactType: 'customer' | 'vendor' = 'customer'
  ): Promise<{ contacts: ZohoContact[]; hasMore: boolean }> {
    const response = await zohoFetch(
      this.getUrl(`/contacts?contact_type=${contactType}&page=${page}&per_page=${perPage}`)
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to fetch Zoho contacts: ${error}`)
    }

    const data = await response.json()
    return {
      contacts: data.contacts || [],
      hasMore: data.page_context?.has_more_page || false,
    }
  }

  async getContact(contactId: string): Promise<ZohoContact> {
    const response = await zohoFetch(this.getUrl(`/contacts/${contactId}`))

    if (!response.ok) {
      throw new Error(`Failed to fetch Zoho contact ${contactId}`)
    }

    const data = await response.json()
    return data.contact
  }

  async createContact(contact: {
    contact_name: string
    email?: string
    phone?: string
    company_name?: string
    contact_type?: 'customer' | 'vendor'
  }): Promise<ZohoContact> {
    const response = await zohoFetch(this.getUrl('/contacts'), {
      method: 'POST',
      body: JSON.stringify({
        ...contact,
        contact_type: contact.contact_type || 'customer',
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to create Zoho contact: ${error}`)
    }

    const data = await response.json()
    return data.contact
  }

  async updateContact(
    contactId: string,
    updates: Partial<{
      contact_name: string
      email: string
      phone: string
      company_name: string
    }>
  ): Promise<ZohoContact> {
    const response = await zohoFetch(this.getUrl(`/contacts/${contactId}`), {
      method: 'PUT',
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to update Zoho contact: ${error}`)
    }

    const data = await response.json()
    return data.contact
  }

  async findContactByEmail(email: string): Promise<ZohoContact | null> {
    const response = await zohoFetch(
      this.getUrl(`/contacts?email=${encodeURIComponent(email)}`)
    )

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.contacts?.[0] || null
  }

  // ============ ESTIMATES (Quotes) ============

  async getEstimates(
    page: number = 1,
    perPage: number = 200
  ): Promise<{ estimates: ZohoEstimate[]; hasMore: boolean }> {
    const response = await zohoFetch(
      this.getUrl(`/estimates?page=${page}&per_page=${perPage}`)
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to fetch Zoho estimates: ${error}`)
    }

    const data = await response.json()
    return {
      estimates: data.estimates || [],
      hasMore: data.page_context?.has_more_page || false,
    }
  }

  async getEstimate(estimateId: string): Promise<ZohoEstimate> {
    const response = await zohoFetch(this.getUrl(`/estimates/${estimateId}`))

    if (!response.ok) {
      throw new Error(`Failed to fetch Zoho estimate ${estimateId}`)
    }

    const data = await response.json()
    return data.estimate
  }

  async createEstimate(estimate: {
    customer_id: string
    line_items: Array<{
      item_id?: string
      name: string
      description?: string
      rate: number
      quantity: number
    }>
    notes?: string
    terms?: string
    expiry_date?: string
    discount?: number
    discount_type?: 'entity_level' | 'item_level'
  }): Promise<ZohoEstimate> {
    const response = await zohoFetch(this.getUrl('/estimates'), {
      method: 'POST',
      body: JSON.stringify(estimate),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to create Zoho estimate: ${error}`)
    }

    const data = await response.json()
    return data.estimate
  }

  async updateEstimate(
    estimateId: string,
    updates: Partial<{
      line_items: Array<{
        item_id?: string
        name: string
        rate: number
        quantity: number
      }>
      notes: string
      terms: string
      expiry_date: string
    }>
  ): Promise<ZohoEstimate> {
    const response = await zohoFetch(this.getUrl(`/estimates/${estimateId}`), {
      method: 'PUT',
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to update Zoho estimate: ${error}`)
    }

    const data = await response.json()
    return data.estimate
  }

  async markEstimateAsSent(estimateId: string): Promise<void> {
    const response = await zohoFetch(
      this.getUrl(`/estimates/${estimateId}/status/sent`),
      { method: 'POST' }
    )

    if (!response.ok) {
      throw new Error(`Failed to mark Zoho estimate as sent`)
    }
  }

  async markEstimateAsAccepted(estimateId: string): Promise<void> {
    const response = await zohoFetch(
      this.getUrl(`/estimates/${estimateId}/status/accepted`),
      { method: 'POST' }
    )

    if (!response.ok) {
      throw new Error(`Failed to mark Zoho estimate as accepted`)
    }
  }

  async markEstimateAsDeclined(estimateId: string): Promise<void> {
    const response = await zohoFetch(
      this.getUrl(`/estimates/${estimateId}/status/declined`),
      { method: 'POST' }
    )

    if (!response.ok) {
      throw new Error(`Failed to mark Zoho estimate as declined`)
    }
  }

  async convertEstimateToInvoice(estimateId: string): Promise<ZohoInvoice> {
    const response = await zohoFetch(
      this.getUrl(`/invoices/fromestimate?estimate_id=${estimateId}`),
      { method: 'POST' }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to convert estimate to invoice: ${error}`)
    }

    const data = await response.json()
    return data.invoice
  }

  // ============ INVOICES ============

  async getInvoices(
    page: number = 1,
    perPage: number = 200
  ): Promise<{ invoices: ZohoInvoice[]; hasMore: boolean }> {
    const response = await zohoFetch(
      this.getUrl(`/invoices?page=${page}&per_page=${perPage}`)
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to fetch Zoho invoices: ${error}`)
    }

    const data = await response.json()
    return {
      invoices: data.invoices || [],
      hasMore: data.page_context?.has_more_page || false,
    }
  }

  async getInvoice(invoiceId: string): Promise<ZohoInvoice> {
    const response = await zohoFetch(this.getUrl(`/invoices/${invoiceId}`))

    if (!response.ok) {
      throw new Error(`Failed to fetch Zoho invoice ${invoiceId}`)
    }

    const data = await response.json()
    return data.invoice
  }

  async createInvoice(invoice: {
    customer_id: string
    line_items: Array<{
      item_id?: string
      name: string
      description?: string
      rate: number
      quantity: number
    }>
    notes?: string
    terms?: string
    due_date?: string
    discount?: number
    discount_type?: 'entity_level' | 'item_level'
  }): Promise<ZohoInvoice> {
    const response = await zohoFetch(this.getUrl('/invoices'), {
      method: 'POST',
      body: JSON.stringify(invoice),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to create Zoho invoice: ${error}`)
    }

    const data = await response.json()
    return data.invoice
  }

  async updateInvoice(
    invoiceId: string,
    updates: Partial<{
      line_items: Array<{
        item_id?: string
        name: string
        rate: number
        quantity: number
      }>
      notes: string
      terms: string
      due_date: string
    }>
  ): Promise<ZohoInvoice> {
    const response = await zohoFetch(this.getUrl(`/invoices/${invoiceId}`), {
      method: 'PUT',
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to update Zoho invoice: ${error}`)
    }

    const data = await response.json()
    return data.invoice
  }

  async markInvoiceAsSent(invoiceId: string): Promise<void> {
    const response = await zohoFetch(
      this.getUrl(`/invoices/${invoiceId}/status/sent`),
      { method: 'POST' }
    )

    if (!response.ok) {
      throw new Error(`Failed to mark Zoho invoice as sent`)
    }
  }

  async markInvoiceAsPaid(invoiceId: string, amount: number, paymentDate?: string): Promise<void> {
    const response = await zohoFetch(this.getUrl('/customerpayments'), {
      method: 'POST',
      body: JSON.stringify({
        customer_id: '', // Will be fetched from invoice
        invoices: [
          {
            invoice_id: invoiceId,
            amount_applied: amount,
          },
        ],
        date: paymentDate || new Date().toISOString().split('T')[0],
        payment_mode: 'cash',
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to record payment for invoice: ${error}`)
    }
  }

  async voidInvoice(invoiceId: string): Promise<void> {
    const response = await zohoFetch(
      this.getUrl(`/invoices/${invoiceId}/status/void`),
      { method: 'POST' }
    )

    if (!response.ok) {
      throw new Error(`Failed to void Zoho invoice`)
    }
  }
}

// Export singleton instance
export const zohoBooks = new ZohoBooksClient()
