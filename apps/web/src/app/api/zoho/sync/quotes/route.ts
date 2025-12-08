import { NextRequest, NextResponse } from 'next/server'
import { syncQuoteToZoho, syncQuoteStatusToZoho } from '@/lib/zoho/sync'
import { isZohoConfigured } from '@/lib/zoho/config'

/**
 * POST /api/zoho/sync/quotes
 * Sync a quote to Zoho Books as an Estimate
 *
 * Body: { quoteId: string, statusOnly?: boolean }
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
    const { quoteId, statusOnly } = body

    if (!quoteId) {
      return NextResponse.json(
        { error: 'quoteId is required' },
        { status: 400 }
      )
    }

    if (statusOnly) {
      // Only sync status
      const result = await syncQuoteStatusToZoho(quoteId)

      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        message: 'Quote status synced to Zoho',
      })
    } else {
      // Full sync
      const result = await syncQuoteToZoho(quoteId)

      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        quoteId,
        zohoBooksEstimateId: result.estimateId,
        zohoEstimateNumber: result.estimateNumber,
      })
    }
  } catch (error) {
    console.error('Quote sync error:', error)
    return NextResponse.json(
      { error: 'Failed to sync quote to Zoho' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/zoho/sync/quotes
 * Get sync status
 */
export async function GET() {
  return NextResponse.json({
    configured: isZohoConfigured(),
    endpoint: 'POST to sync quotes to Zoho Books Estimates',
    body: '{ quoteId: string, statusOnly?: boolean }',
  })
}
