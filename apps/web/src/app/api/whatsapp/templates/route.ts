import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// WhatsApp Business API Configuration
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || ''
const WHATSAPP_BUSINESS_ACCOUNT_ID = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || ''

// Default templates for development (when API not configured)
const DEFAULT_TEMPLATES = [
  {
    name: 'welcome_message',
    status: 'APPROVED',
    category: 'UTILITY',
    language: 'en',
    components: [
      {
        type: 'BODY',
        text: 'Hello {{1}}! Thank you for contacting Easy Services Group. How can we assist you today?'
      }
    ]
  },
  {
    name: 'quote_follow_up',
    status: 'APPROVED',
    category: 'UTILITY',
    language: 'en',
    components: [
      {
        type: 'BODY',
        text: 'Hi {{1}}, just following up on the quote we sent for {{2}}. Do you have any questions?'
      }
    ]
  },
  {
    name: 'document_ready',
    status: 'APPROVED',
    category: 'UTILITY',
    language: 'en',
    components: [
      {
        type: 'BODY',
        text: 'Good news, {{1}}! Your {{2}} is ready for collection. Please visit our office during business hours or contact us to arrange delivery.'
      }
    ]
  },
  {
    name: 'appointment_reminder',
    status: 'APPROVED',
    category: 'UTILITY',
    language: 'en',
    components: [
      {
        type: 'BODY',
        text: 'Hi {{1}}, this is a reminder of your appointment on {{2}} at {{3}}. Reply YES to confirm or NO to reschedule.'
      }
    ]
  },
  {
    name: 'payment_received',
    status: 'APPROVED',
    category: 'UTILITY',
    language: 'en',
    components: [
      {
        type: 'BODY',
        text: 'Thank you, {{1}}! We have received your payment of R{{2}} for invoice {{3}}. Your receipt will be emailed shortly.'
      }
    ]
  }
]

/**
 * GET - Retrieve available WhatsApp message templates
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // If WhatsApp API is not configured, return default templates
    if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_BUSINESS_ACCOUNT_ID) {
      return NextResponse.json({
        templates: DEFAULT_TEMPLATES,
        source: 'default'
      })
    }

    // Fetch templates from WhatsApp Business API
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates?limit=100`,
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`
        }
      }
    )

    if (!response.ok) {
      console.error('Failed to fetch WhatsApp templates:', await response.text())
      // Fall back to default templates
      return NextResponse.json({
        templates: DEFAULT_TEMPLATES,
        source: 'default',
        warning: 'Could not fetch templates from WhatsApp API'
      })
    }

    const data = await response.json()

    // Filter to only approved templates
    const approvedTemplates = data.data?.filter(
      (t: any) => t.status === 'APPROVED'
    ) || []

    return NextResponse.json({
      templates: approvedTemplates,
      source: 'api'
    })

  } catch (error) {
    console.error('Error fetching WhatsApp templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
