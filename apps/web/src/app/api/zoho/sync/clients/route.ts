import { NextRequest, NextResponse } from 'next/server'
import {
  syncClientToZoho,
  syncAllClientsToZoho,
  syncClientsFromZoho,
} from '@/lib/zoho/sync'
import { isZohoConfigured } from '@/lib/zoho/config'

/**
 * POST /api/zoho/sync/clients
 * Sync clients between Zoho and helpdesk
 *
 * Body:
 *   { clientId?: string } - Sync single client to Zoho
 *   { direction: 'from_zoho' } - Pull all clients from Zoho Books
 *   { direction: 'to_zoho' } - Push all unsynced clients to Zoho
 */
export async function POST(request: NextRequest) {
  try {
    if (!isZohoConfigured()) {
      return NextResponse.json(
        { error: 'Zoho integration not configured' },
        { status: 503 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { clientId, direction } = body

    // Pull from Zoho
    if (direction === 'from_zoho') {
      const result = await syncClientsFromZoho()
      return NextResponse.json({
        success: true,
        direction: 'from_zoho',
        message: `Pulled ${result.created} new clients, updated ${result.updated}, skipped ${result.skipped}`,
        ...result,
      })
    }

    // Sync single client to Zoho
    if (clientId) {
      const result = await syncClientToZoho(clientId)

      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        clientId,
        zohoBooksContactId: result.booksContactId,
        zohoCrmContactId: result.crmContactId,
      })
    }

    // Push all to Zoho (default)
    const result = await syncAllClientsToZoho()

    return NextResponse.json({
      success: true,
      direction: 'to_zoho',
      message: `Synced ${result.created} new clients, updated ${result.updated} existing`,
      ...result,
    })
  } catch (error) {
    console.error('Clients sync error:', error)
    return NextResponse.json(
      { error: 'Failed to sync clients' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/zoho/sync/clients
 * Get sync status
 */
export async function GET() {
  return NextResponse.json({
    configured: isZohoConfigured(),
    endpoints: {
      pullFromZoho: 'POST { direction: "from_zoho" }',
      pushToZoho: 'POST { direction: "to_zoho" }',
      syncSingle: 'POST { clientId: "..." }',
    },
  })
}
