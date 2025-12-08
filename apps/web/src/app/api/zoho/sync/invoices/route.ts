import { NextRequest, NextResponse } from 'next/server'
import { syncInvoiceToZoho, syncInvoiceStatusToZoho } from '@/lib/zoho/sync'
import { isZohoConfigured } from '@/lib/zoho/config'

/**
 * POST /api/zoho/sync/invoices
 * Sync an invoice to Zoho Books
 *
 * Body: { invoiceId: string, statusOnly?: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    if (!isZohoConfigured()) {
      return NextResponse.json(
        { error: 'Zoho integration not configured' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { invoiceId, statusOnly } = body

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'invoiceId is required' },
        { status: 400 }
      )
    }

    if (statusOnly) {
      // Only sync status
      const result = await syncInvoiceStatusToZoho(invoiceId)

      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        message: 'Invoice status synced to Zoho',
      })
    } else {
      // Full sync
      const result = await syncInvoiceToZoho(invoiceId)

      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        invoiceId,
        zohoBooksInvoiceId: result.zohoInvoiceId,
        zohoInvoiceNumber: result.invoiceNumber,
      })
    }
  } catch (error) {
    console.error('Invoice sync error:', error)
    return NextResponse.json(
      { error: 'Failed to sync invoice to Zoho' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/zoho/sync/invoices
 * Get sync status
 */
export async function GET() {
  return NextResponse.json({
    configured: isZohoConfigured(),
    endpoint: 'POST to sync invoices to Zoho Books',
    body: '{ invoiceId: string, statusOnly?: boolean }',
  })
}
