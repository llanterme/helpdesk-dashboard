import { NextRequest, NextResponse } from 'next/server'
import {
  syncQuoteToZoho,
  syncQuoteStatusToZoho,
  handleQuoteStatusChange,
} from '@/lib/zoho/sync'
import { isZohoConfigured } from '@/lib/zoho/config'

/**
 * POST /api/zoho/sync/quotes
 * Sync a quote to Zoho Books as an Estimate
 *
 * Body:
 *   { quoteId: string } - Full sync of quote to Zoho
 *   { quoteId: string, statusOnly: true } - Only sync status
 *   { quoteId: string, status: "SENT" | "ACCEPTED" | "REJECTED" } - Handle status change
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
    const { quoteId, statusOnly, status } = body

    if (!quoteId) {
      return NextResponse.json(
        { error: 'quoteId is required' },
        { status: 400 }
      )
    }

    // Handle status change (auto-syncs quote first if needed)
    if (status) {
      const result = await handleQuoteStatusChange(quoteId, status)

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        message: `Quote status changed to ${status} and synced to Zoho`,
        zohoId: result.zohoId,
      })
    }

    // Only sync status
    if (statusOnly) {
      const result = await syncQuoteStatusToZoho(quoteId)

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        message: 'Quote status synced to Zoho',
        zohoId: result.zohoId,
      })
    }

    // Full sync
    const result = await syncQuoteToZoho(quoteId)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      quoteId,
      zohoBooksEstimateId: result.estimateId,
      zohoEstimateNumber: result.estimateNumber,
    })
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
 * Get sync endpoint info
 */
export async function GET() {
  return NextResponse.json({
    configured: isZohoConfigured(),
    endpoints: {
      fullSync: 'POST { quoteId: "..." }',
      statusOnly: 'POST { quoteId: "...", statusOnly: true }',
      statusChange: 'POST { quoteId: "...", status: "SENT" | "ACCEPTED" | "REJECTED" }',
    },
  })
}
