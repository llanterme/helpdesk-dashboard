import { prisma } from '@/lib/prisma'

// Microsoft Graph API configuration
const GRAPH_API_BASE = 'https://graph.microsoft.com/v1.0'
const OAUTH_BASE = 'https://login.microsoftonline.com'

export interface MicrosoftTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  scope: string
}

export interface GraphEmail {
  id: string
  conversationId: string
  subject: string
  bodyPreview: string
  body: {
    contentType: string
    content: string
  }
  from: {
    emailAddress: {
      name: string
      address: string
    }
  }
  toRecipients: Array<{
    emailAddress: {
      name: string
      address: string
    }
  }>
  ccRecipients: Array<{
    emailAddress: {
      name: string
      address: string
    }
  }>
  bccRecipients: Array<{
    emailAddress: {
      name: string
      address: string
    }
  }>
  receivedDateTime: string
  sentDateTime: string
  hasAttachments: boolean
  isRead: boolean
  internetMessageId: string
  internetMessageHeaders?: Array<{
    name: string
    value: string
  }>
  parentFolderId: string
}

export interface GraphAttachment {
  id: string
  name: string
  contentType: string
  size: number
  isInline: boolean
  contentBytes?: string // Base64 encoded
  contentId?: string
}

export interface GraphSubscription {
  id: string
  resource: string
  changeType: string
  notificationUrl: string
  expirationDateTime: string
  clientState: string
}

export interface SendEmailOptions {
  to: string[]
  cc?: string[]
  bcc?: string[]
  subject: string
  body: string
  isHtml?: boolean
  attachments?: Array<{
    name: string
    contentType: string
    contentBytes: string // Base64
  }>
  inReplyTo?: string // Internet Message ID for threading
}

class MicrosoftGraphClient {
  private clientId: string
  private clientSecret: string
  private redirectUri: string

  constructor() {
    this.clientId = process.env.MICROSOFT_CLIENT_ID || ''
    this.clientSecret = process.env.MICROSOFT_CLIENT_SECRET || ''
    this.redirectUri = `${process.env.NEXTAUTH_URL}/api/email/callback`
  }

  // Generate OAuth authorization URL
  getAuthorizationUrl(state: string, tenantId: string = 'common'): string {
    const scopes = [
      'offline_access',
      'Mail.Read',
      'Mail.ReadWrite',
      'Mail.Send',
      'User.Read',
    ].join(' ')

    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      response_mode: 'query',
      scope: scopes,
      state,
    })

    return `${OAUTH_BASE}/${tenantId}/oauth2/v2.0/authorize?${params.toString()}`
  }

  // Exchange authorization code for tokens
  async exchangeCodeForTokens(
    code: string,
    tenantId: string = 'common'
  ): Promise<MicrosoftTokenResponse> {
    const response = await fetch(
      `${OAUTH_BASE}/${tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code,
          redirect_uri: this.redirectUri,
          grant_type: 'authorization_code',
        }),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Token exchange failed: ${JSON.stringify(error)}`)
    }

    return response.json()
  }

  // Refresh access token
  async refreshAccessToken(
    refreshToken: string,
    tenantId: string = 'common'
  ): Promise<MicrosoftTokenResponse> {
    const response = await fetch(
      `${OAUTH_BASE}/${tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Token refresh failed: ${JSON.stringify(error)}`)
    }

    return response.json()
  }

  // Get valid access token for an email account (auto-refresh if expired)
  async getValidToken(accountId: string): Promise<string> {
    const account = await prisma.emailAccount.findUnique({
      where: { id: accountId },
    })

    if (!account || !account.accessToken || !account.refreshToken) {
      throw new Error('Email account not found or not authenticated')
    }

    // Check if token is expired (with 5 min buffer)
    const now = new Date()
    const bufferMs = 5 * 60 * 1000
    const isExpired =
      account.tokenExpiry && account.tokenExpiry.getTime() - bufferMs < now.getTime()

    if (isExpired) {
      // Refresh the token
      const tokens = await this.refreshAccessToken(
        account.refreshToken,
        account.tenantId || 'common'
      )

      // Update stored tokens
      await prisma.emailAccount.update({
        where: { id: accountId },
        data: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
        },
      })

      return tokens.access_token
    }

    return account.accessToken
  }

  // Make authenticated Graph API request
  private async graphRequest<T>(
    accessToken: string,
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${GRAPH_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }))
      throw new Error(`Graph API error: ${JSON.stringify(error)}`)
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T
    }

    return response.json()
  }

  // Get user profile
  async getUserProfile(accessToken: string): Promise<{
    mail: string
    displayName: string
    userPrincipalName: string
  }> {
    return this.graphRequest(accessToken, '/me')
  }

  // List messages from inbox
  async listMessages(
    accessToken: string,
    options: {
      folderId?: string
      top?: number
      skip?: number
      filter?: string
      orderBy?: string
      select?: string[]
    } = {}
  ): Promise<{ value: GraphEmail[]; '@odata.nextLink'?: string }> {
    const folder = options.folderId || 'inbox'
    const params = new URLSearchParams()

    if (options.top) params.set('$top', options.top.toString())
    if (options.skip) params.set('$skip', options.skip.toString())
    if (options.filter) params.set('$filter', options.filter)
    if (options.orderBy) params.set('$orderby', options.orderBy)
    if (options.select) params.set('$select', options.select.join(','))

    const queryString = params.toString()
    const endpoint = `/me/mailFolders/${folder}/messages${queryString ? `?${queryString}` : ''}`

    return this.graphRequest(accessToken, endpoint)
  }

  // Get single message with full details
  async getMessage(
    accessToken: string,
    messageId: string,
    includeHeaders: boolean = true
  ): Promise<GraphEmail> {
    let endpoint = `/me/messages/${messageId}`
    if (includeHeaders) {
      endpoint += '?$expand=internetMessageHeaders'
    }
    return this.graphRequest(accessToken, endpoint)
  }

  // Get message attachments
  async getAttachments(
    accessToken: string,
    messageId: string
  ): Promise<{ value: GraphAttachment[] }> {
    return this.graphRequest(accessToken, `/me/messages/${messageId}/attachments`)
  }

  // Get single attachment content
  async getAttachment(
    accessToken: string,
    messageId: string,
    attachmentId: string
  ): Promise<GraphAttachment> {
    return this.graphRequest(
      accessToken,
      `/me/messages/${messageId}/attachments/${attachmentId}`
    )
  }

  // Send email
  async sendEmail(
    accessToken: string,
    options: SendEmailOptions
  ): Promise<void> {
    const message: Record<string, unknown> = {
      subject: options.subject,
      body: {
        contentType: options.isHtml ? 'HTML' : 'Text',
        content: options.body,
      },
      toRecipients: options.to.map((email) => ({
        emailAddress: { address: email },
      })),
    }

    if (options.cc?.length) {
      message.ccRecipients = options.cc.map((email) => ({
        emailAddress: { address: email },
      }))
    }

    if (options.bcc?.length) {
      message.bccRecipients = options.bcc.map((email) => ({
        emailAddress: { address: email },
      }))
    }

    if (options.attachments?.length) {
      message.attachments = options.attachments.map((att) => ({
        '@odata.type': '#microsoft.graph.fileAttachment',
        name: att.name,
        contentType: att.contentType,
        contentBytes: att.contentBytes,
      }))
    }

    // Handle reply threading
    if (options.inReplyTo) {
      message.internetMessageHeaders = [
        {
          name: 'In-Reply-To',
          value: options.inReplyTo,
        },
      ]
    }

    await this.graphRequest(accessToken, '/me/sendMail', {
      method: 'POST',
      body: JSON.stringify({ message, saveToSentItems: true }),
    })
  }

  // Reply to a message
  async replyToMessage(
    accessToken: string,
    messageId: string,
    comment: string,
    isHtml: boolean = true
  ): Promise<void> {
    await this.graphRequest(accessToken, `/me/messages/${messageId}/reply`, {
      method: 'POST',
      body: JSON.stringify({
        comment,
      }),
    })
  }

  // Mark message as read
  async markAsRead(
    accessToken: string,
    messageId: string,
    isRead: boolean = true
  ): Promise<void> {
    await this.graphRequest(accessToken, `/me/messages/${messageId}`, {
      method: 'PATCH',
      body: JSON.stringify({ isRead }),
    })
  }

  // Create webhook subscription for new emails
  async createSubscription(
    accessToken: string,
    notificationUrl: string,
    clientState: string
  ): Promise<GraphSubscription> {
    const expirationDateTime = new Date(
      Date.now() + 4230 * 60 * 1000 // Max ~3 days for mail
    ).toISOString()

    return this.graphRequest(accessToken, '/subscriptions', {
      method: 'POST',
      body: JSON.stringify({
        changeType: 'created',
        notificationUrl,
        resource: '/me/mailFolders/inbox/messages',
        expirationDateTime,
        clientState,
      }),
    })
  }

  // Renew webhook subscription
  async renewSubscription(
    accessToken: string,
    subscriptionId: string
  ): Promise<GraphSubscription> {
    const expirationDateTime = new Date(
      Date.now() + 4230 * 60 * 1000
    ).toISOString()

    return this.graphRequest(accessToken, `/subscriptions/${subscriptionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ expirationDateTime }),
    })
  }

  // Delete webhook subscription
  async deleteSubscription(
    accessToken: string,
    subscriptionId: string
  ): Promise<void> {
    await this.graphRequest(accessToken, `/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
    })
  }

  // Search emails
  async searchEmails(
    accessToken: string,
    query: string,
    top: number = 25
  ): Promise<{ value: GraphEmail[] }> {
    const filter = `contains(subject,'${query}') or contains(from/emailAddress/address,'${query}')`
    return this.listMessages(accessToken, {
      filter,
      top,
      orderBy: 'receivedDateTime desc',
    })
  }
}

export const microsoftGraph = new MicrosoftGraphClient()
