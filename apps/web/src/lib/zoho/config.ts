/**
 * Zoho API Configuration
 *
 * Environment Variables Required:
 * - ZOHO_CLIENT_ID: OAuth Client ID from Zoho Developer Console
 * - ZOHO_CLIENT_SECRET: OAuth Client Secret
 * - ZOHO_REFRESH_TOKEN: Long-lived refresh token
 * - ZOHO_ORGANIZATION_ID: Zoho Books Organization ID
 * - ZOHO_REGION: API region (com, eu, in, com.au, jp) - defaults to 'com'
 */

export interface ZohoConfig {
  clientId: string
  clientSecret: string
  refreshToken: string
  organizationId: string
  region: string
}

// Get the region-specific base URLs
export const getZohoBaseUrls = (region: string = 'com') => {
  const regionSuffix = region === 'com' ? '' : `.${region}`

  return {
    accounts: `https://accounts.zoho${regionSuffix}.com`,
    books: `https://www.zohoapis${regionSuffix}.com/books/v3`,
    crm: `https://www.zohoapis${regionSuffix}.com/crm/v6`,
  }
}

export const getZohoConfig = (): ZohoConfig => {
  const clientId = process.env.ZOHO_CLIENT_ID
  const clientSecret = process.env.ZOHO_CLIENT_SECRET
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN
  const organizationId = process.env.ZOHO_ORGANIZATION_ID
  const region = process.env.ZOHO_REGION || 'com'

  if (!clientId || !clientSecret || !refreshToken || !organizationId) {
    throw new Error(
      'Missing Zoho configuration. Required: ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN, ZOHO_ORGANIZATION_ID'
    )
  }

  return {
    clientId,
    clientSecret,
    refreshToken,
    organizationId,
    region,
  }
}

// Check if Zoho integration is configured
export const isZohoConfigured = (): boolean => {
  return !!(
    process.env.ZOHO_CLIENT_ID &&
    process.env.ZOHO_CLIENT_SECRET &&
    process.env.ZOHO_REFRESH_TOKEN &&
    process.env.ZOHO_ORGANIZATION_ID
  )
}
