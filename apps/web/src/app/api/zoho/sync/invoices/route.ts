import { NextRequest, NextResponse } from 'next/server'
import {
  syncInvoiceToZoho,
  syncInvoiceStatusToZoho,
  syncPaymentToZoho,
} from '@/lib/zoho/sync'
import { isZohoConfigured } from '@/lib/zoho/config'

/**
 * POST /api/zoho/sync/invoices
 * Sync an invoice to Zoho Books
 *
 * Body:
 *   { invoiceId: string } - Full sync of invoice to Zoho
 *   { invoiceId: string, statusOnly: true } - Only sync status
 *   { invoiceId: string, payment: { amount, date, mode } } - Record payment
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
    const { invoiceId, statusOnly, payment } = body

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'invoiceId is required' },
        { status: 400 }
      )
    }

    // Record payment
    if (payment) {
      const { amount, date, mode } = payment

      if (!amount) {
        return NextResponse.json(
          { error: 'payment.amount is required' },
          { status: 400 }
        )
      }

      const result = await syncPaymentToZoho(
        invoiceId,
        amount,
        date ? new Date(date) : new Date(),
        mode || 'bank_transfer'
      )

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        message: 'Payment recorded in Zoho',
        paymentId: result.paymentId,
      })
    }

    // Only sync status
    if (statusOnly) {
      const result = await syncInvoiceStatusToZoho(invoiceId)

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        message: 'Invoice status synced to Zoho',
        zohoId: result.zohoId,
      })
    }

    // Full sync
    const result = await syncInvoiceToZoho(invoiceId)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      invoiceId,
      zohoBooksInvoiceId: result.zohoInvoiceId,
      zohoInvoiceNumber: result.invoiceNumber,
    })
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
 * Get sync endpoint info
 */
export async function GET() {
  return NextResponse.json({
    configured: isZohoConfigured(),
    endpoints: {
      fullSync: 'POST { invoiceId: "..." }',
      statusOnly: 'POST { invoiceId: "...", statusOnly: true }',
      recordPayment: 'POST { invoiceId: "...", payment: { amount, date?, mode? } }',
    },
  })
}
