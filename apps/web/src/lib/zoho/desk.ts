/**
 * Zoho Desk API Client
 *
 * Handles integration with Zoho Desk for WhatsApp messaging via HelloSend
 *
 * API Reference: https://desk.zoho.com/DeskAPIDocument
 */

import { getZohoConfig, getZohoBaseUrls, getZohoDeskConfig, isZohoDeskConfigured } from './config'
import { zohoFetch } from './auth'

// ============ TYPES ============

export interface ZohoDeskTicket {
  id: string
  ticketNumber: string
  subject: string
  description?: string
  status: string
  statusType: string
  priority?: string
  channel: string
  channelCode?: string
  contactId: string
  departmentId: string
  assigneeId?: string
  createdTime: string
  modifiedTime: string
  closedTime?: string
  cf?: Record<string, any> // Custom fields
  contact?: ZohoDeskContact
  assignee?: ZohoDeskAgent
}

export interface ZohoDeskContact {
  id: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  mobile?: string
  accountId?: string
}

export interface ZohoDeskAgent {
  id: string
  firstName: string
  lastName: string
  email: string
  name?: string
}

export interface ZohoDeskThread {
  id: string
  content: string
  contentType: string // 'html' or 'plainText'
  direction: 'in' | 'out'
  type: string // 'reply', 'comment', 'forward'
  channel?: string
  fromEmailAddress?: string
  toEmailAddress?: string
  createdTime: string
  author?: {
    id: string
    name: string
    email?: string
    type: 'AGENT' | 'CONTACT' | 'SYSTEM'
  }
  attachments?: ZohoDeskAttachment[]
}

export interface ZohoDeskAttachment {
  id: string
  name: string
  size: number
  href: string
}

export interface ZohoDeskDepartment {
  id: string
  name: string
  isEnabled: boolean
}

// ============ CLIENT ============

class ZohoDeskClient {
  private baseUrl: string
  private orgId: string
  private departmentId: string

  constructor() {
    const config = getZohoConfig()
    const deskConfig = getZohoDeskConfig()
    const urls = getZohoBaseUrls(config.region)

    this.baseUrl = urls.desk
    this.orgId = deskConfig.orgId
    this.departmentId = deskConfig.departmentId
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const headers = new Headers(options.headers || {})
    headers.set('orgId', this.orgId)

    const response = await zohoFetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.text()
      console.error(`Zoho Desk API error: ${response.status}`, error)
      throw new Error(`Zoho Desk API error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  // ============ DEPARTMENTS ============

  async getDepartments(): Promise<ZohoDeskDepartment[]> {
    const response = await this.request<{ data: ZohoDeskDepartment[] }>(
      '/departments'
    )
    return response.data || []
  }

  async getDepartment(id: string): Promise<ZohoDeskDepartment> {
    return this.request<ZohoDeskDepartment>(`/departments/${id}`)
  }

  // ============ TICKETS ============

  async getTickets(options: {
    departmentId?: string
    status?: string
    channel?: string
    from?: number
    limit?: number
    sortBy?: string
  } = {}): Promise<{ data: ZohoDeskTicket[]; count: number }> {
    const params = new URLSearchParams()

    if (options.departmentId || this.departmentId) {
      params.set('departmentId', options.departmentId || this.departmentId)
    }
    if (options.status) params.set('status', options.status)
    if (options.channel) params.set('channel', options.channel)
    if (options.from) params.set('from', options.from.toString())
    if (options.limit) params.set('limit', options.limit.toString())
    if (options.sortBy) params.set('sortBy', options.sortBy)

    const query = params.toString()
    const endpoint = `/tickets${query ? `?${query}` : ''}`

    return this.request<{ data: ZohoDeskTicket[]; count: number }>(endpoint)
  }

  async getWhatsAppTickets(options: {
    status?: string
    from?: number
    limit?: number
  } = {}): Promise<{ data: ZohoDeskTicket[]; count: number }> {
    return this.getTickets({
      ...options,
      channel: 'WhatsApp', // HelloSend creates tickets with this channel
    })
  }

  async getTicket(id: string, include?: string[]): Promise<ZohoDeskTicket> {
    const params = include?.length
      ? `?include=${include.join(',')}`
      : ''
    return this.request<ZohoDeskTicket>(`/tickets/${id}${params}`)
  }

  async createTicket(data: {
    subject: string
    departmentId?: string
    contactId: string
    description?: string
    status?: string
    priority?: string
    channel?: string
    assigneeId?: string
    cf?: Record<string, any>
  }): Promise<ZohoDeskTicket> {
    return this.request<ZohoDeskTicket>('/tickets', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        departmentId: data.departmentId || this.departmentId,
        channel: data.channel || 'WhatsApp',
      }),
    })
  }

  async updateTicket(
    id: string,
    data: Partial<{
      subject: string
      status: string
      priority: string
      assigneeId: string
      cf: Record<string, any>
    }>
  ): Promise<ZohoDeskTicket> {
    return this.request<ZohoDeskTicket>(`/tickets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async closeTicket(id: string): Promise<ZohoDeskTicket> {
    return this.updateTicket(id, { status: 'Closed' })
  }

  // ============ THREADS (MESSAGES) ============

  async getThreads(ticketId: string, options: {
    from?: number
    limit?: number
  } = {}): Promise<{ data: ZohoDeskThread[] }> {
    const params = new URLSearchParams()
    if (options.from) params.set('from', options.from.toString())
    if (options.limit) params.set('limit', options.limit.toString())

    const query = params.toString()
    const endpoint = `/tickets/${ticketId}/threads${query ? `?${query}` : ''}`

    return this.request<{ data: ZohoDeskThread[] }>(endpoint)
  }

  async getThread(ticketId: string, threadId: string): Promise<ZohoDeskThread> {
    return this.request<ZohoDeskThread>(
      `/tickets/${ticketId}/threads/${threadId}`
    )
  }

  async addReply(
    ticketId: string,
    content: string,
    options: {
      isPublic?: boolean
      channel?: string
      contentType?: 'html' | 'plainText'
    } = {}
  ): Promise<ZohoDeskThread> {
    return this.request<ZohoDeskThread>(`/tickets/${ticketId}/sendReply`, {
      method: 'POST',
      body: JSON.stringify({
        content,
        contentType: options.contentType || 'plainText',
        isPublic: options.isPublic !== false,
        channel: options.channel || 'WhatsApp',
      }),
    })
  }

  async addComment(
    ticketId: string,
    content: string,
    isPublic: boolean = false
  ): Promise<ZohoDeskThread> {
    return this.request<ZohoDeskThread>(`/tickets/${ticketId}/comments`, {
      method: 'POST',
      body: JSON.stringify({
        content,
        contentType: 'plainText',
        isPublic,
      }),
    })
  }

  // Send WhatsApp reply through HelloSend integration
  async sendWhatsAppReply(
    ticketId: string,
    content: string
  ): Promise<ZohoDeskThread> {
    // In Zoho Desk, sending a reply on a WhatsApp ticket automatically
    // routes through the connected WhatsApp channel (HelloSend)
    return this.addReply(ticketId, content, {
      channel: 'WhatsApp',
      isPublic: true,
    })
  }

  // ============ CONTACTS ============

  async getContacts(options: {
    from?: number
    limit?: number
    sortBy?: string
  } = {}): Promise<{ data: ZohoDeskContact[] }> {
    const params = new URLSearchParams()
    if (options.from) params.set('from', options.from.toString())
    if (options.limit) params.set('limit', options.limit.toString())
    if (options.sortBy) params.set('sortBy', options.sortBy)

    const query = params.toString()
    return this.request<{ data: ZohoDeskContact[] }>(
      `/contacts${query ? `?${query}` : ''}`
    )
  }

  async getContact(id: string): Promise<ZohoDeskContact> {
    return this.request<ZohoDeskContact>(`/contacts/${id}`)
  }

  async findContactByEmail(email: string): Promise<ZohoDeskContact | null> {
    const response = await this.request<{ data: ZohoDeskContact[] }>(
      `/contacts/search?email=${encodeURIComponent(email)}`
    )
    return response.data?.[0] || null
  }

  async findContactByPhone(phone: string): Promise<ZohoDeskContact | null> {
    // Clean the phone number
    const cleanPhone = phone.replace(/\D/g, '')
    const response = await this.request<{ data: ZohoDeskContact[] }>(
      `/contacts/search?phone=${encodeURIComponent(cleanPhone)}`
    )
    return response.data?.[0] || null
  }

  async createContact(data: {
    lastName: string
    firstName?: string
    email?: string
    phone?: string
    mobile?: string
  }): Promise<ZohoDeskContact> {
    return this.request<ZohoDeskContact>('/contacts', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // ============ AGENTS ============

  async getAgents(): Promise<{ data: ZohoDeskAgent[] }> {
    return this.request<{ data: ZohoDeskAgent[] }>('/agents')
  }

  async getAgent(id: string): Promise<ZohoDeskAgent> {
    return this.request<ZohoDeskAgent>(`/agents/${id}`)
  }
}

// Export singleton instance
export const zohoDesk = new ZohoDeskClient()

// Export configuration check
export { isZohoDeskConfigured }
