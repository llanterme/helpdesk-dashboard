/**
 * Zoho OAuth Token Management
 *
 * Handles access token refresh and caching
 * Access tokens are valid for 1 hour
 */

import { getZohoConfig, getZohoBaseUrls } from './config'

interface TokenCache {
  accessToken: string
  expiresAt: number
}

// In-memory token cache (in production, consider Redis or similar)
let tokenCache: TokenCache | null = null

/**
 * Get a valid access token, refreshing if necessary
 */
export async function getAccessToken(): Promise<string> {
  // Check if we have a valid cached token (with 5-minute buffer)
  if (tokenCache && tokenCache.expiresAt > Date.now() + 5 * 60 * 1000) {
    return tokenCache.accessToken
  }

  // Refresh the token
  const config = getZohoConfig()
  const urls = getZohoBaseUrls(config.region)

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: config.refreshToken,
  })

  const response = await fetch(`${urls.accounts}/oauth/v2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Zoho token refresh failed:', error)
    throw new Error(`Failed to refresh Zoho access token: ${response.status}`)
  }

  const data = await response.json()

  if (!data.access_token) {
    throw new Error('No access token in Zoho response')
  }

  // Cache the token (expires_in is in seconds, typically 3600)
  tokenCache = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
  }

  return tokenCache.accessToken
}

/**
 * Clear the token cache (useful for testing or force refresh)
 */
export function clearTokenCache(): void {
  tokenCache = null
}

/**
 * Make an authenticated request to Zoho API
 */
export async function zohoFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const accessToken = await getAccessToken()

  const headers = new Headers(options.headers || {})
  headers.set('Authorization', `Zoho-oauthtoken ${accessToken}`)

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }

  return fetch(url, {
    ...options,
    headers,
  })
}
