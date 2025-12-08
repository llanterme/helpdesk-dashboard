import { NextRequest, NextResponse } from 'next/server'
import { syncServicesFromZoho } from '@/lib/zoho/sync'
import { isZohoConfigured } from '@/lib/zoho/config'

/**
 * POST /api/zoho/sync/services
 * Sync services from Zoho Books Items to local database
 */
export async function POST(request: NextRequest) {
  try {
    if (!isZohoConfigured()) {
      return NextResponse.json(
        { error: 'Zoho integration not configured. Please set environment variables.' },
        { status: 503 }
      )
    }

    const result = await syncServicesFromZoho()

    return NextResponse.json({
      success: true,
      message: `Synced ${result.created} new services, updated ${result.updated} existing`,
      ...result,
    })
  } catch (error) {
    console.error('Services sync error:', error)
    return NextResponse.json(
      { error: 'Failed to sync services from Zoho' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/zoho/sync/services
 * Get sync status
 */
export async function GET() {
  return NextResponse.json({
    configured: isZohoConfigured(),
    endpoint: 'POST to sync services from Zoho Books Items',
  })
}
