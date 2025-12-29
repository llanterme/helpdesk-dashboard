/**
 * IMAP/SMTP Email Client for GoDaddy and other standard email providers
 *
 * GoDaddy Settings:
 * - IMAP: imap.secureserver.net (port 993, SSL)
 * - SMTP: smtpout.secureserver.net (port 465, SSL)
 */

import Imap from 'imap'
import { simpleParser, ParsedMail } from 'mailparser'
import nodemailer from 'nodemailer'
import { prisma } from '@/lib/prisma'

export interface ImapConfig {
  host: string
  port: number
  user: string
  password: string
  tls: boolean
}

export interface SmtpConfig {
  host: string
  port: number
  user: string
  password: string
  secure: boolean
}

export interface EmailMessage {
  id: string
  uid: string
  messageId: string
  subject: string
  from: { name: string; address: string }
  to: { name: string; address: string }[]
  cc?: { name: string; address: string }[]
  date: Date
  textBody?: string
  htmlBody?: string
  flags: string[]
  inReplyTo?: string
  references?: string[]
  attachments: {
    filename: string
    contentType: string
    size: number
    content?: Buffer
  }[]
}

export interface ImapSendEmailOptions {
  from: string | { name: string; address: string }
  to: string | string[]
  cc?: string | string[]
  bcc?: string | string[]
  subject: string
  text?: string
  html?: string
  replyTo?: string
  inReplyTo?: string
  references?: string[]
  attachments?: {
    filename: string
    content: Buffer | string
    contentType?: string
  }[]
}

// GoDaddy server presets
export const GODADDY_IMAP: Omit<ImapConfig, 'user' | 'password'> = {
  host: 'imap.secureserver.net',
  port: 993,
  tls: true,
}

export const GODADDY_SMTP: Omit<SmtpConfig, 'user' | 'password'> = {
  host: 'smtpout.secureserver.net',
  port: 465,
  secure: true,
}

class ImapEmailClient {
  /**
   * Fetch emails from IMAP server
   */
  async fetchEmails(
    config: ImapConfig,
    options: {
      folder?: string
      limit?: number
      since?: Date
      unseen?: boolean
    } = {}
  ): Promise<EmailMessage[]> {
    const { folder = 'INBOX', limit = 50, since, unseen = false } = options

    return new Promise((resolve, reject) => {
      const imap = new Imap({
        user: config.user,
        password: config.password,
        host: config.host,
        port: config.port,
        tls: config.tls,
        tlsOptions: { rejectUnauthorized: false },
      })

      const messages: EmailMessage[] = []

      imap.once('ready', () => {
        imap.openBox(folder, true, (err, box) => {
          if (err) {
            imap.end()
            return reject(err)
          }

          // Build search criteria
          const searchCriteria: any[] = []
          if (unseen) searchCriteria.push('UNSEEN')
          if (since) searchCriteria.push(['SINCE', since])
          if (searchCriteria.length === 0) searchCriteria.push('ALL')

          imap.search(searchCriteria, (err, results) => {
            if (err) {
              imap.end()
              return reject(err)
            }

            if (results.length === 0) {
              imap.end()
              return resolve([])
            }

            // Get the most recent emails up to limit
            const toFetch = results.slice(-limit)

            const fetch = imap.fetch(toFetch, {
              bodies: '',
              struct: true,
            })

            fetch.on('message', (msg, seqno) => {
              let msgFlags: string[] = []
              let msgUid: string = seqno.toString()

              msg.on('attributes', (attrs) => {
                msgFlags = attrs.flags || []
                msgUid = attrs.uid?.toString() || seqno.toString()
              })

              msg.on('body', (stream, info) => {
                let buffer = ''
                stream.on('data', (chunk) => {
                  buffer += chunk.toString('utf8')
                })
                stream.on('end', async () => {
                  try {
                    const parsed = await simpleParser(buffer)
                    const email = this.parsedMailToEmailMessage(parsed, msgUid, msgFlags)
                    messages.push(email)
                  } catch (parseErr) {
                    console.error('Error parsing email:', parseErr)
                  }
                })
              })
            })

            fetch.once('error', (fetchErr) => {
              imap.end()
              reject(fetchErr)
            })

            fetch.once('end', () => {
              imap.end()
              // Sort by date descending
              messages.sort((a, b) => b.date.getTime() - a.date.getTime())
              resolve(messages)
            })
          })
        })
      })

      imap.once('error', (err: Error) => {
        reject(err)
      })

      imap.connect()
    })
  }

  /**
   * Fetch a single email by UID
   */
  async fetchEmail(config: ImapConfig, uid: string, folder: string = 'INBOX'): Promise<EmailMessage | null> {
    return new Promise((resolve, reject) => {
      const imap = new Imap({
        user: config.user,
        password: config.password,
        host: config.host,
        port: config.port,
        tls: config.tls,
        tlsOptions: { rejectUnauthorized: false },
      })

      imap.once('ready', () => {
        imap.openBox(folder, true, (err, box) => {
          if (err) {
            imap.end()
            return reject(err)
          }

          const fetch = imap.fetch([parseInt(uid)], {
            bodies: '',
            struct: true,
          })

          let email: EmailMessage | null = null

          fetch.on('message', (msg, seqno) => {
            msg.on('body', (stream, info) => {
              let buffer = ''
              stream.on('data', (chunk) => {
                buffer += chunk.toString('utf8')
              })
              stream.on('end', async () => {
                try {
                  const parsed = await simpleParser(buffer)
                  email = this.parsedMailToEmailMessage(parsed, uid)
                } catch (parseErr) {
                  console.error('Error parsing email:', parseErr)
                }
              })
            })
          })

          fetch.once('error', (fetchErr) => {
            imap.end()
            reject(fetchErr)
          })

          fetch.once('end', () => {
            imap.end()
            resolve(email)
          })
        })
      })

      imap.once('error', (err: Error) => {
        reject(err)
      })

      imap.connect()
    })
  }

  /**
   * Mark email as read
   */
  async markAsRead(config: ImapConfig, uid: string, folder: string = 'INBOX'): Promise<void> {
    return new Promise((resolve, reject) => {
      const imap = new Imap({
        user: config.user,
        password: config.password,
        host: config.host,
        port: config.port,
        tls: config.tls,
        tlsOptions: { rejectUnauthorized: false },
      })

      imap.once('ready', () => {
        imap.openBox(folder, false, (err, box) => {
          if (err) {
            imap.end()
            return reject(err)
          }

          imap.addFlags([parseInt(uid)], ['\\Seen'], (err) => {
            imap.end()
            if (err) reject(err)
            else resolve()
          })
        })
      })

      imap.once('error', (err: Error) => {
        reject(err)
      })

      imap.connect()
    })
  }

  /**
   * Send email via SMTP
   */
  async sendEmail(config: SmtpConfig, options: ImapSendEmailOptions): Promise<{ messageId: string }> {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.password,
      },
    })

    const result = await transporter.sendMail({
      from: options.from,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined,
      bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined,
      subject: options.subject,
      text: options.text,
      html: options.html,
      replyTo: options.replyTo,
      inReplyTo: options.inReplyTo,
      references: options.references?.join(' '),
      attachments: options.attachments?.map((att) => ({
        filename: att.filename,
        content: att.content,
        contentType: att.contentType,
      })),
    })

    return { messageId: result.messageId }
  }

  /**
   * Test IMAP connection
   */
  async testConnection(config: ImapConfig): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      const imap = new Imap({
        user: config.user,
        password: config.password,
        host: config.host,
        port: config.port,
        tls: config.tls,
        tlsOptions: { rejectUnauthorized: false },
        connTimeout: 10000,
      })

      imap.once('ready', () => {
        imap.end()
        resolve({ success: true })
      })

      imap.once('error', (err: Error) => {
        resolve({ success: false, error: err.message })
      })

      imap.connect()
    })
  }

  /**
   * Test SMTP connection
   */
  async testSmtpConnection(config: SmtpConfig): Promise<{ success: boolean; error?: string }> {
    try {
      const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: config.user,
          pass: config.password,
        },
      })

      await transporter.verify()
      return { success: true }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  }

  /**
   * Convert parsed mail to our EmailMessage format
   */
  private parsedMailToEmailMessage(parsed: ParsedMail, id: string, flags: string[] = []): EmailMessage {
    const fromAddr = parsed.from?.value?.[0] || { name: '', address: '' }
    const toAddrs = parsed.to
      ? (Array.isArray(parsed.to) ? parsed.to : [parsed.to]).flatMap((t) => t.value || [])
      : []
    const ccAddrs = parsed.cc
      ? (Array.isArray(parsed.cc) ? parsed.cc : [parsed.cc]).flatMap((c) => c.value || [])
      : []

    return {
      id,
      uid: id,
      messageId: parsed.messageId || id,
      subject: parsed.subject || '(No Subject)',
      from: {
        name: fromAddr.name || fromAddr.address || '',
        address: fromAddr.address || '',
      },
      to: toAddrs.map((t) => ({
        name: t.name || t.address || '',
        address: t.address || '',
      })),
      cc: ccAddrs.map((c) => ({
        name: c.name || c.address || '',
        address: c.address || '',
      })),
      date: parsed.date || new Date(),
      textBody: parsed.text || '',
      htmlBody: parsed.html || undefined,
      flags,
      inReplyTo: parsed.inReplyTo,
      references: parsed.references
        ? Array.isArray(parsed.references)
          ? parsed.references
          : [parsed.references]
        : undefined,
      attachments: (parsed.attachments || []).map((att) => ({
        filename: att.filename || 'attachment',
        contentType: att.contentType || 'application/octet-stream',
        size: att.size || 0,
        content: att.content,
      })),
    }
  }

  /**
   * Get IMAP config from database account
   */
  async getImapConfigFromAccount(accountId: string): Promise<ImapConfig | null> {
    const account = await prisma.emailAccount.findUnique({
      where: { id: accountId },
    })

    if (!account || !account.imapPassword) return null

    return {
      host: account.imapHost || GODADDY_IMAP.host,
      port: account.imapPort || GODADDY_IMAP.port,
      user: account.email,
      password: account.imapPassword,
      tls: true,
    }
  }

  /**
   * Get SMTP config from database account
   */
  async getSmtpConfigFromAccount(accountId: string): Promise<SmtpConfig | null> {
    const account = await prisma.emailAccount.findUnique({
      where: { id: accountId },
    })

    if (!account || !account.smtpPassword) return null

    return {
      host: account.smtpHost || GODADDY_SMTP.host,
      port: account.smtpPort || GODADDY_SMTP.port,
      user: account.email,
      password: account.smtpPassword,
      secure: true,
    }
  }
}

// Export singleton instance
export const imapClient = new ImapEmailClient()
