import { NextResponse } from 'next/server'
import { isZohoConfigured, getZohoConfig, getZohoBaseUrls } from '@/lib/zoho/config'
import { getAccessToken } from '@/lib/zoho/auth'

/**
 * GET /api/zoho/status
 * Check Zoho integration status and connectivity
 */
export async function GET() {
  const configured = isZohoConfigured()

  if (!configured) {
    return NextResponse.json({
      configured: false,
      connected: false,
      message: 'Zoho integration not configured. Set environment variables.',
      requiredEnvVars: [
        'ZOHO_CLIENT_ID',
        'ZOHO_CLIENT_SECRET',
        'ZOHO_REFRESH_TOKEN',
        'ZOHO_ORGANIZATION_ID',
      ],
      optionalEnvVars: ['ZOHO_REGION'],
    })
  }

  try {
    // Try to get an access token to verify connectivity
    const token = await getAccessToken()
    const config = getZohoConfig()
    const urls = getZohoBaseUrls(config.region)

    return NextResponse.json({
      configured: true,
      connected: true,
      region: config.region,
      organizationId: config.organizationId,
      endpoints: {
        books: urls.books,
        crm: urls.crm,
      },
      tokenStatus: token ? 'valid' : 'invalid',
      syncEndpoints: {
        services: 'POST /api/zoho/sync/services',
        clients: 'POST /api/zoho/sync/clients',
        quotes: 'POST /api/zoho/sync/quotes',
        invoices: 'POST /api/zoho/sync/invoices',
      },
    })
  } catch (error) {
    return NextResponse.json({
      configured: true,
      connected: false,
      error: `Failed to connect to Zoho: ${error}`,
      message: 'Check your credentials and refresh token',
    })
  }
}
