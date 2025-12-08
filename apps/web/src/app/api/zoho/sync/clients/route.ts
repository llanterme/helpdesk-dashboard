import { NextRequest, NextResponse } from 'next/server'
import { syncClientToZoho, syncAllClientsToZoho } from '@/lib/zoho/sync'
import { isZohoConfigured } from '@/lib/zoho/config'

/**
 * POST /api/zoho/sync/clients
 * Sync clients to Zoho Books and CRM
 *
 * Body: { clientId?: string } - If provided, sync single client; otherwise sync all unsynced
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
    const { clientId } = body

    if (clientId) {
      // Sync single client
      const result = await syncClientToZoho(clientId)

      if (result.error) {
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
    } else {
      // Sync all unsynced clients
      const result = await syncAllClientsToZoho()

      return NextResponse.json({
        success: true,
        message: `Synced ${result.created} new clients, updated ${result.updated} existing`,
        ...result,
      })
    }
  } catch (error) {
    console.error('Clients sync error:', error)
    return NextResponse.json(
      { error: 'Failed to sync clients to Zoho' },
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
    endpoint: 'POST to sync clients to Zoho Books and CRM',
    body: '{ clientId?: string } - optional, syncs all if not provided',
  })
}
