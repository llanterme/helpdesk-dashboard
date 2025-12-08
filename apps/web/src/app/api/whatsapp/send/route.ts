import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@helpdesk/database'

const prisma = new PrismaClient()

// WhatsApp Business API Configuration
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || ''
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || ''

/**
 * Send a WhatsApp message from the helpdesk
 * POST /api/whatsapp/send
 *
 * Body:
 * - ticketId: string (required)
 * - message: string (required)
 * - templateName?: string (for template messages)
 * - templateParams?: string[] (parameters for template)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify agent is authenticated
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { ticketId, message, templateName, templateParams } = body

    if (!ticketId || !message) {
      return NextResponse.json(
        { error: 'ticketId and message are required' },
        { status: 400 }
      )
    }

    // Get ticket with client info
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { client: true }
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    if (ticket.channel !== 'WHATSAPP') {
      return NextResponse.json(
        { error: 'This ticket is not a WhatsApp conversation' },
        { status: 400 }
      )
    }

    const whatsappId = ticket.client.whatsappId
    if (!whatsappId) {
      return NextResponse.json(
        { error: 'Client does not have a WhatsApp ID' },
        { status: 400 }
      )
    }

    // Send the message via WhatsApp API
    const result = await sendWhatsAppMessage(whatsappId, message, templateName, templateParams)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send WhatsApp message' },
        { status: 500 }
      )
    }

    // Store the message in database
    const storedMessage = await prisma.message.create({
      data: {
        ticketId,
        senderType: 'AGENT',
        senderId: session.user?.id || null,
        content: message,
        timestamp: new Date(),
        read: true,
        whatsappMessageId: result.messageId,
        whatsappStatus: 'SENT'
      }
    })

    // Update ticket timestamp
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() }
    })

    return NextResponse.json({
      success: true,
      messageId: storedMessage.id,
      whatsappMessageId: result.messageId
    })

  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Send a message via WhatsApp Business API
 */
async function sendWhatsAppMessage(
  recipientPhone: string,
  message: string,
  templateName?: string,
  templateParams?: string[]
): Promise<{ success: boolean; messageId?: string; error?: string }> {

  // Check if WhatsApp API is configured
  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    // Development mode - simulate sending
    console.log('WhatsApp API not configured - simulating message send')
    console.log(`To: ${recipientPhone}`)
    console.log(`Message: ${message}`)

    return {
      success: true,
      messageId: `dev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  try {
    let requestBody: any

    if (templateName) {
      // Send template message (for initial/marketing messages)
      requestBody = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipientPhone,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'en' },
          components: templateParams?.length ? [{
            type: 'body',
            parameters: templateParams.map(param => ({
              type: 'text',
              text: param
            }))
          }] : []
        }
      }
    } else {
      // Send regular text message (within 24-hour window)
      requestBody = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipientPhone,
        type: 'text',
        text: { body: message }
      }
    }

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      }
    )

    const data = await response.json()

    if (!response.ok) {
      console.error('WhatsApp API error:', data)
      return {
        success: false,
        error: data.error?.message || 'Failed to send message'
      }
    }

    return {
      success: true,
      messageId: data.messages?.[0]?.id
    }

  } catch (error) {
    console.error('Error calling WhatsApp API:', error)
    return {
      success: false,
      error: 'Failed to connect to WhatsApp API'
    }
  }
}
