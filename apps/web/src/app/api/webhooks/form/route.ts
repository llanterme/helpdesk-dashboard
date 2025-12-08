import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@helpdesk/database'

const prisma = new PrismaClient()

// API key for webhook authentication (should be in env vars in production)
const WEBHOOK_API_KEY = process.env.WEBHOOK_API_KEY || 'esg-webhook-key-2024'

// CORS headers for cross-origin requests from website
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
}

// Handle preflight OPTIONS request
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

/**
 * Public webhook endpoint for form submissions
 * This endpoint receives contact form submissions from the Easy Services website
 * and creates a new ticket + client in the helpdesk system
 *
 * Expected payload:
 * {
 *   name: string (required)
 *   email: string (required)
 *   phone?: string
 *   service?: string
 *   message: string (required)
 *   source?: string (page URL or form identifier)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify API key (optional security layer)
    const apiKey = request.headers.get('X-API-Key')
    if (apiKey && apiKey !== WEBHOOK_API_KEY) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401, headers: corsHeaders }
      )
    }

    const data = await request.json()
    const { name, email, phone, service, message, source } = data

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, message' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Find or create client
    let client = await prisma.client.findUnique({
      where: { email }
    })

    if (!client) {
      client = await prisma.client.create({
        data: {
          name,
          email,
          phone: phone || null,
          company: null
        }
      })
    } else {
      // Update client info if they already exist (in case phone changed)
      if (phone && phone !== client.phone) {
        client = await prisma.client.update({
          where: { id: client.id },
          data: { phone }
        })
      }
    }

    // Generate ticket subject based on service or generic
    const ticketSubject = service
      ? `${service} Enquiry from ${name}`
      : `Contact Form Enquiry from ${name}`

    // Create ticket with FORM channel
    const ticket = await prisma.ticket.create({
      data: {
        subject: ticketSubject,
        clientId: client.id,
        channel: 'FORM',
        priority: 'MEDIUM',
        status: 'OPEN',
        unread: true
      }
    })

    // Create initial message with form content
    const messageContent = buildMessageContent({
      name,
      email,
      phone,
      service,
      message,
      source
    })

    await prisma.message.create({
      data: {
        ticketId: ticket.id,
        senderType: 'CLIENT',
        senderId: client.id,
        content: messageContent,
        read: false
      }
    })

    // Return success response
    return NextResponse.json(
      {
        success: true,
        ticketId: ticket.id,
        message: 'Your enquiry has been received. We will contact you shortly.'
      },
      { status: 201, headers: corsHeaders }
    )
  } catch (error) {
    console.error('Error processing form submission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}

/**
 * Build a formatted message content from form fields
 */
function buildMessageContent(data: {
  name: string
  email: string
  phone?: string
  service?: string
  message: string
  source?: string
}): string {
  const lines = [
    `**New Contact Form Submission**`,
    ``,
    `**Name:** ${data.name}`,
    `**Email:** ${data.email}`,
  ]

  if (data.phone) {
    lines.push(`**Phone:** ${data.phone}`)
  }

  if (data.service) {
    lines.push(`**Service Requested:** ${data.service}`)
  }

  lines.push(``)
  lines.push(`**Message:**`)
  lines.push(data.message)

  if (data.source) {
    lines.push(``)
    lines.push(`---`)
    lines.push(`*Submitted from: ${data.source}*`)
  }

  return lines.join('\n')
}
