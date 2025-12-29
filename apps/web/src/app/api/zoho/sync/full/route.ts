/**
 * Full Zoho Sync API Endpoints
 *
 * POST /api/zoho/sync/full - Run full sync (from Zoho or to Zoho)
 * GET /api/zoho/sync/full - Get sync status
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  runFullSyncFromZoho,
  runFullSyncToZoho,
  getSyncStatus,
  getRecentSyncLogs,
} from '@/lib/zoho/sync'
import { isZohoConfigured } from '@/lib/zoho/config'

export async function GET() {
  try {
    if (!isZohoConfigured()) {
      return NextResponse.json(
        {
          configured: false,
          message: 'Zoho integration not configured',
        },
        { status: 200 }
      )
    }

    const [status, recentLogs] = await Promise.all([
      getSyncStatus(),
      getRecentSyncLogs(20),
    ])

    return NextResponse.json({
      configured: true,
      status,
      recentLogs,
    })
  } catch (error) {
    console.error('Failed to get sync status:', error)
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isZohoConfigured()) {
      return NextResponse.json(
        { error: 'Zoho integration not configured' },
        { status: 400 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const direction = body.direction || 'from_zoho'

    let result
    if (direction === 'to_zoho') {
      result = await runFullSyncToZoho()
    } else {
      result = await runFullSyncFromZoho()
    }

    return NextResponse.json({
      success: true,
      direction,
      result,
    })
  } catch (error) {
    console.error('Full sync failed:', error)
    return NextResponse.json(
      { error: `Full sync failed: ${error}` },
      { status: 500 }
    )
  }
}
